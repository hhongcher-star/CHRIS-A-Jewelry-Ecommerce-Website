import { AppError } from '../errors/app-error.js';

export function validate(schema, input) {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields = {};
  for (const issue of result.error.issues) {
    fields[issue.path.join('.') || 'request'] = issue.message;
  }
  throw new AppError(422, 'VALIDATION_ERROR', 'The submitted data is invalid.', fields);
}
