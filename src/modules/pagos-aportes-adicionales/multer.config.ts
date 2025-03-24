// src/pagos-aportes/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
  storage: diskStorage({
    destination: './src/modules/pagos-aportes-adicionales/pagos', // Carpeta de destino
    filename: (req, file, callback) => {
      // Obtener id_planilla_adicional y fecha_pago del cuerpo de la solicitud
      const id_planilla_adicional = req.body.id_planilla_adicional || 'unknown';
      let fecha = 'unknown';
      let hora = 'unknown';

      if (req.body.fecha_pago) {
        const date = new Date(req.body.fecha_pago);
        // Formato de fecha: YYYYMMDD (20250314)
        fecha = date.toISOString().slice(0, 10).replace(/-/g, '');
        // Formato de hora: HHMMSS (100000)
        hora = date.toISOString().slice(11, 19).replace(/:/g, '');
      }

      const ext = extname(file.originalname); // Obtener la extensión del archivo original
      const filename = `${id_planilla_adicional}-${fecha}-${hora}${ext}`; // Nombre personalizado: id-fecha-hora.extension
      callback(null, filename);
    },
  }),
  fileFilter: (req, file, callback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Solo se permiten archivos JPEG, PNG y PDF'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};