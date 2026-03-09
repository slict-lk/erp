import { z } from 'zod';
import { CustomModuleField } from './types';

/**
 * Builds a dynamic Zod schema based on the custom module field definitions.
 * This can be used to validate incoming API requests and form submissions.
 */
export function buildDynamicSchema(fields: CustomModuleField[]) {
    const schemaShape: Record<string, z.ZodTypeAny> = {};

    for (const field of fields) {
        let fieldSchema: z.ZodTypeAny;

        switch (field.type) {
            case 'text':
            case 'textarea':
                fieldSchema = z.string();
                if (field.validation?.min) fieldSchema = (fieldSchema as z.ZodString).min(field.validation.min);
                if (field.validation?.max) fieldSchema = (fieldSchema as z.ZodString).max(field.validation.max);
                if (field.validation?.pattern) fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.validation.pattern));
                break;

            case 'number':
            case 'currency':
                // Values from forms often come as strings, so coerce them to numbers
                fieldSchema = z.coerce.number();
                if (field.validation?.min !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min);
                if (field.validation?.max !== undefined) fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max);
                break;

            case 'date':
                // Coerce string dates into proper Date objects, or string ISO dates
                fieldSchema = z.coerce.date().transform(d => d.toISOString());
                break;

            case 'boolean':
                // Checkboxes might send 'on', 'true', true, false etc.
                fieldSchema = z.union([z.boolean(), z.string()]).transform(val => {
                    if (typeof val === 'string') return val === 'true' || val === 'on' || val === '1';
                    return val;
                });
                break;

            case 'email':
                fieldSchema = z.string().email();
                break;

            case 'phone':
                fieldSchema = z.string().min(5).max(20);
                break;

            case 'url':
                fieldSchema = z.string().url();
                break;

            case 'select':
                if (field.options && field.options.length > 0) {
                    fieldSchema = z.enum(field.options as [string, ...string[]]);
                } else {
                    fieldSchema = z.string();
                }
                break;

            case 'multiselect':
                if (field.options && field.options.length > 0) {
                    fieldSchema = z.array(z.enum(field.options as [string, ...string[]]));
                } else {
                    fieldSchema = z.array(z.string());
                }
                if (field.settings?.maxSelections) {
                    fieldSchema = (fieldSchema as z.ZodArray<any>).max(field.settings.maxSelections);
                }
                break;

            case 'json':
                // Basic JSON validation (checks if object/array)
                fieldSchema = z.any().refine(val => {
                    try {
                        if (typeof val === 'string') JSON.parse(val);
                        return true;
                    } catch {
                        return false;
                    }
                }, { message: 'Invalid JSON' });
                // After parsing as boolean/string, transform
                fieldSchema = fieldSchema.transform((v) => {
                    if (typeof v === 'string') return JSON.parse(v);
                    return v;
                });
                break;

            case 'lookup':
                // Usually stores the ID of the related record
                fieldSchema = z.string().cuid();
                break;

            case 'file':
                // Stores URL or object reference
                fieldSchema = z.string();
                break;

            default:
                fieldSchema = z.any();
        }

        if (field.required) {
            // If it's a string, ensure it's not empty
            if (fieldSchema instanceof z.ZodString) {
                fieldSchema = fieldSchema.min(1, { message: `${field.label} is required` });
            } else if (fieldSchema instanceof z.ZodArray) {
                fieldSchema = fieldSchema.min(1, { message: `${field.label} is required` });
            }
        } else {
            // If optional, allow undefined or null (and empty string for text fields)
            if (fieldSchema instanceof z.ZodString) {
                fieldSchema = z.union([fieldSchema, z.literal('')]).optional().nullable().transform(val => val === '' ? null : val);
            } else {
                fieldSchema = fieldSchema.optional().nullable();
            }
        }

        schemaShape[field.name] = fieldSchema;
    }

    return z.object(schemaShape);
}

/**
 * Validates record data against the module's fields definitions.
 * Throws ZodError if validation fails.
 */
export function validateRecordData(fields: CustomModuleField[], data: Record<string, any>) {
    const schema = buildDynamicSchema(fields);
    return schema.parse(data);
}

/**
 * Validates record data, returning SafeParseReturnType.
 * Non-throwing version.
 */
export function safeValidateRecordData(fields: CustomModuleField[], data: Record<string, any>) {
    const schema = buildDynamicSchema(fields);
    return schema.safeParse(data);
}
