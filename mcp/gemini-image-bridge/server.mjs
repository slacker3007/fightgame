#!/usr/bin/env node
/**
 * MCP bridge: exposes `generate_image` compatible with Cursor's tool schema,
 * but uses a configurable Gemini model (default: gemini-2.5-flash-image).
 *
 * Env:
 *   GEMINI_API_KEY (required)
 *   GEMINI_IMAGE_MODEL (optional, default: gemini-2.5-flash-image)
 */
import dotenv from "dotenv";
import { mkdir, writeFile, stat, readFile } from "fs/promises";
import * as path from "path";
import { z } from "zod";
import sharp from "sharp";
import { GoogleGenAI, Modality } from "@google/genai";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set.");
  process.exit(1);
}

const IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";

const ai = new GoogleGenAI({ apiKey: API_KEY });

const DEFAULT_OUTPUT_DIRECTORY = "output/images";
const DEFAULT_FILE_NAME = "generated_image";
const DEFAULT_TARGET_IMAGE_MAX_SIZE = 512;
const DEFAULT_JPEG_QUALITY = 80;
const DEFAULT_WEBP_QUALITY = 80;
const DEFAULT_PNG_COMPRESSION_LEVEL = 9;

const MIME_TYPES = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
  OCTET_STREAM: "application/octet-stream",
};
const EXTENSIONS = { JPG: "jpg", PNG: "png", WEBP: "webp" };

const ASSISTANT_PROMPT_TEMPLATE_WITH_IMAGES = `You are a professional image generation AI. Follow the steps below to generate the best possible image.

Step 1: Analyze Input Images (if any)
For each input image, thoroughly analyze and organize its key features (e.g., subject, style, mood, composition, color tone, motifs).

Step 2: Plan Integration with User Prompt
Deeply understand the analyzed features of the input images from Step 1 and the content of the "User Prompt" below. Then, plan how to creatively incorporate which elements of the input images into the new image to best realize the user's intent.

Step 3: Generate High-Quality Image
Based on the plan above, generate a high-quality image that faithfully reflects the instructions in the user prompt and effectively utilizes the elements of the input images.

--- User Prompt ---
{{USER_PROMPT}}
--- User Prompt End ---
`;

const ASSISTANT_PROMPT_TEMPLATE_NO_IMAGES = `You are a professional image generation AI. Follow the steps below to generate the best possible image.

Step 1: Understand User Prompt
Deeply understand the content of the "User Prompt" below and clarify what kind of image should be generated.

Step 2: Generate High-Quality Image
Based on the understanding above, generate a high-quality image that faithfully reflects the instructions in the user prompt.

--- User Prompt ---
{{USER_PROMPT}}
--- User Prompt End ---
`;

async function getUniqueFilePath(directory, baseName, extension) {
  let counter = 0;
  let outputPath = "";
  while (true) {
    const currentFileName = counter === 0 ? baseName : `${baseName} (${counter})`;
    outputPath = path.join(directory, `${currentFileName}.${extension}`);
    try {
      await stat(outputPath);
      counter++;
    } catch (e) {
      if (e?.code === "ENOENT") break;
      throw e;
    }
  }
  return outputPath;
}

async function processAndCompressImage(
  imageBuffer,
  originalFormat,
  conversionType,
  targetImageMaxSize,
  { jpegQuality, webpQuality, pngCompressionLevel }
) {
  const sharpInstance = sharp(imageBuffer).resize(
    targetImageMaxSize,
    targetImageMaxSize,
    { fit: "inside" }
  );
  const targetFormat =
    conversionType || (originalFormat === "jpeg" ? "jpeg" : "png");

  if (targetFormat === "jpeg") {
    const buf = await sharpInstance
      .jpeg({ quality: jpegQuality, progressive: true, mozjpeg: true })
      .toBuffer();
    return { processedBuffer: buf, extension: EXTENSIONS.JPG };
  }
  if (targetFormat === "webp") {
    const buf = await sharpInstance.webp({ quality: webpQuality }).toBuffer();
    return { processedBuffer: buf, extension: EXTENSIONS.WEBP };
  }
  const buf = await sharpInstance
    .png({ compressionLevel: pngCompressionLevel })
    .toBuffer();
  return { processedBuffer: buf, extension: EXTENSIONS.PNG };
}

const generateImageInputSchema = z.object({
  prompt: z
    .string()
    .describe(
      "Text prompt for image generation. If input images are provided, include instructions on how to use them to create the new image. English is recommended."
    ),
  output_directory: z
    .string()
    .default(DEFAULT_OUTPUT_DIRECTORY)
    .describe(`The directory path to save the image. Defaults to '${DEFAULT_OUTPUT_DIRECTORY}'.`),
  file_name: z
    .string()
    .default(DEFAULT_FILE_NAME)
    .describe(
      `The name of the image file to be saved (without extension). Defaults to '${DEFAULT_FILE_NAME}'.`
    ),
  input_image_paths: z
    .array(z.string().describe("Absolute path of the image file."))
    .optional()
    .describe(
      "Optional. A list of file paths for input images to be used as a reference for generation."
    ),
  use_enhanced_prompt: z
    .boolean()
    .default(true)
    .describe(
      "Whether to use an enhanced prompt to assist the AI's instructions. Defaults to true."
    ),
  target_image_max_size: z
    .number()
    .int()
    .positive()
    .optional()
    .default(DEFAULT_TARGET_IMAGE_MAX_SIZE)
    .describe(
      `The maximum length (in pixels) of the longest side of the resized image. The original aspect ratio is maintained. Defaults to ${DEFAULT_TARGET_IMAGE_MAX_SIZE}.`
    ),
  force_conversion_type: z
    .enum(["jpeg", "webp", "png"])
    .optional()
    .describe(
      "Optionally force conversion to a specific format ('jpeg', 'webp', 'png'). If not specified, the original format will be processed, defaulting to PNG for non-JPEG images."
    ),
  skip_compression_and_resizing: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Whether to skip compression and resizing of the generated image. If true, `force_conversion_type` and `target_image_max_size` are ignored. Defaults to false."
    ),
  jpeg_quality: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .default(DEFAULT_JPEG_QUALITY)
    .describe(`JPEG quality (0-100). Defaults to ${DEFAULT_JPEG_QUALITY}.`),
  webp_quality: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .default(DEFAULT_WEBP_QUALITY)
    .describe(`WebP quality (0-100). Defaults to ${DEFAULT_WEBP_QUALITY}.`),
  png_compression_level: z
    .number()
    .int()
    .min(0)
    .max(9)
    .optional()
    .default(DEFAULT_PNG_COMPRESSION_LEVEL)
    .describe(
      `PNG compression level (0-9). Defaults to ${DEFAULT_PNG_COMPRESSION_LEVEL}.`
    ),
  optipng_optimization_level: z
    .number()
    .int()
    .min(0)
    .max(7)
    .optional()
    .default(2)
    .describe("Ignored in bridge (kept for schema compatibility)."),
});

async function executeGenerateImage(args) {
  const {
    prompt,
    output_directory,
    file_name,
    input_image_paths,
    use_enhanced_prompt,
    target_image_max_size,
    force_conversion_type,
    skip_compression_and_resizing,
    webp_quality,
    jpeg_quality,
    png_compression_level,
  } = args;

  let imageParts = [];
  if (input_image_paths?.length) {
    imageParts = await Promise.all(
      input_image_paths.map(async (filePath) => {
        const fileBuffer = await readFile(filePath);
        const base64Data = fileBuffer.toString("base64");
        const extension = path.extname(filePath).toLowerCase().substring(1);
        const mimeTypeMap = {
          png: MIME_TYPES.PNG,
          jpg: MIME_TYPES.JPEG,
          jpeg: MIME_TYPES.JPEG,
          webp: MIME_TYPES.WEBP,
        };
        const resolvedMimeType = mimeTypeMap[extension] || MIME_TYPES.OCTET_STREAM;
        return {
          inlineData: { data: base64Data, mimeType: resolvedMimeType },
        };
      })
    );
  }

  await mkdir(output_directory, { recursive: true });

  let processedPrompt;
  if (use_enhanced_prompt) {
    const tpl =
      imageParts.length > 0
        ? ASSISTANT_PROMPT_TEMPLATE_WITH_IMAGES
        : ASSISTANT_PROMPT_TEMPLATE_NO_IMAGES;
    processedPrompt = tpl.replace("{{USER_PROMPT}}", prompt);
  } else {
    processedPrompt = prompt;
  }

  const textPart = { text: processedPrompt };
  const allParts =
    imageParts.length > 0 ? [textPart, ...imageParts] : [textPart];

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: [{ role: "user", parts: allParts }],
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  if (!response.candidates?.[0]?.content?.parts) {
    let errorMessage =
      "Image generation failed. The response may be empty or in an unexpected format.";
    if (response.promptFeedback) {
      errorMessage += `\n[Feedback] ${JSON.stringify(response.promptFeedback, null, 2)}`;
    }
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason) {
      errorMessage += `\n[Finish Reason] ${candidate.finishReason}`;
    }
    throw new Error(errorMessage);
  }

  let imageData;
  let imageMimeType;
  for (const part of response.candidates[0].content.parts) {
    if (
      part.inlineData?.mimeType?.startsWith("image/") &&
      part.inlineData?.data
    ) {
      imageData = part.inlineData.data;
      imageMimeType = part.inlineData.mimeType;
      break;
    }
  }

  if (!imageData || !imageMimeType) {
    const detail = response.candidates[0].content.parts
      ?.map((p) => p.text || p.inlineData?.mimeType || "unknown_part")
      .join(", ");
    throw new Error(`No valid image data found in the response. Received parts: [${detail || "none"}]`);
  }

  const imageBuffer = Buffer.from(imageData, "base64");
  const meta = await sharp(imageBuffer).metadata();
  const originalSizeKB = (imageBuffer.length / 1024).toFixed(2);

  let finalImageBuffer;
  let finalExtension;
  let processedSizeKB;
  let baseMessage;

  if (skip_compression_and_resizing) {
    if (imageMimeType === MIME_TYPES.PNG) finalExtension = EXTENSIONS.PNG;
    else if (imageMimeType === MIME_TYPES.JPEG) finalExtension = EXTENSIONS.JPG;
    else if (imageMimeType === MIME_TYPES.WEBP) finalExtension = EXTENSIONS.WEBP;
    else finalExtension = EXTENSIONS.JPG;
    finalImageBuffer = imageBuffer;
    processedSizeKB = originalSizeKB;
    baseMessage = "generated (uncompressed)";
  } else {
    const { processedBuffer, extension } = await processAndCompressImage(
      imageBuffer,
      meta.format,
      force_conversion_type,
      target_image_max_size,
      {
        jpegQuality: jpeg_quality,
        webpQuality: webp_quality,
        pngCompressionLevel: png_compression_level,
      }
    );
    finalImageBuffer = processedBuffer;
    finalExtension = extension;
    processedSizeKB = (finalImageBuffer.length / 1024).toFixed(2);
    baseMessage = "generated and compressed";
  }

  const outputPath = await getUniqueFilePath(
    output_directory,
    file_name,
    finalExtension
  );
  await writeFile(outputPath, finalImageBuffer);

  return {
    content: [
      {
        type: "text",
        text: `Image successfully ${baseMessage} at ${outputPath}.\nOriginal size: ${originalSizeKB}KB, Final size: ${processedSizeKB}KB\n(model: ${IMAGE_MODEL})`,
      },
    ],
  };
}

const server = new McpServer({
  name: "fightgame-gemini-image-bridge",
  version: "1.0.0",
  description: `Gemini image MCP bridge using model: ${IMAGE_MODEL}`,
});

server.tool(
  "generate_image",
  "Generates an image based on a prompt and saves it to the specified path.",
  generateImageInputSchema.shape,
  async (args) => {
    try {
      const res = await executeGenerateImage(args);
      if (res?.content?.[0]?.text) {
        return { content: [{ type: "text", text: res.content[0].text }] };
      }
      return {
        content: [
          {
            type: "text",
            text: "Processing completed, but an unexpected response was received.",
          },
        ],
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `An error occurred during image generation: ${msg}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
