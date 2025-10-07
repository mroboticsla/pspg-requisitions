/**
 * Utilidades para procesar imágenes de perfil
 * - Redimensiona imágenes a 512x512px
 * - Convierte a formato WebP para optimizar tamaño
 * - Comprime imágenes manteniendo calidad
 */

import imageCompression from 'browser-image-compression';

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Obtiene las dimensiones de una imagen desde un File o Blob
 */
export const getImageDimensions = (file: File | Blob): Promise<ImageDimensions> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Verifica si una imagen es cuadrada (relación de aspecto 1:1)
 */
export const isSquareImage = async (file: File | Blob): Promise<boolean> => {
  const dimensions = await getImageDimensions(file);
  return dimensions.width === dimensions.height;
};

/**
 * Redimensiona y convierte una imagen a WebP
 * @param file - Archivo de imagen a procesar
 * @param maxSize - Tamaño máximo en píxeles (por defecto 512)
 * @returns Blob de la imagen procesada en formato WebP
 */
export const resizeAndConvertToWebP = async (
  file: File | Blob,
  maxSize: number = 512
): Promise<Blob> => {
  const options = {
    maxSizeMB: 0.5, // Tamaño máximo de 500KB
    maxWidthOrHeight: maxSize, // Redimensionar a 512x512
    useWebWorker: true,
    fileType: 'image/webp', // Convertir a WebP
    initialQuality: 0.85, // Calidad inicial del 85%
  };

  try {
    const compressedFile = await imageCompression(file as File, options);
    return compressedFile;
  } catch (error) {
    console.error('Error al procesar imagen:', error);
    throw new Error('No se pudo procesar la imagen');
  }
};

/**
 * Convierte un canvas a Blob WebP
 */
export const canvasToWebP = (
  canvas: HTMLCanvasElement,
  quality: number = 0.85
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/webp',
      quality
    );
  });
};

/**
 * Crea un canvas con la imagen recortada
 */
export const createCroppedCanvas = (
  image: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
  targetSize: number = 512
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo crear el contexto del canvas');
  }

  // Configurar el canvas al tamaño objetivo
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Calcular el factor de escala
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Dibujar la imagen recortada y redimensionada
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    targetSize,
    targetSize
  );

  return canvas;
};

/**
 * Valida que el archivo sea una imagen válida
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Por favor selecciona una imagen válida (JPG, PNG, WebP o GIF)',
    };
  }

  // Validar tamaño máximo (5MB)
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `La imagen es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
};
