import { buildImportValidationReport } from '../lib/import.js';

export function registerImportRoutes(app, { importRateLimit }) {
  app.post('/api/import', importRateLimit, (req, res) => {
    try {
      const report = buildImportValidationReport(req.body);
      res.json(report);
    } catch (error) {
      res.status(error.statusCode ?? 500).json({
        error: error.message ?? 'Failed to validate import payload.',
      });
    }
  });
}
