import { z } from 'zod';
import { settingsRepository } from '../repository/SettingsRepository';
import { Settings } from '../entity/Settings';

export const EXPIRATION_ALERT_DAYS_OPTIONS = [7, 15, 30, 60] as const;

export const updateSettingsSchema = z.object({
  generalMinStock: z.number().int().min(0, 'El stock mínimo general no puede ser negativo').optional(),
  expirationAlertDays: z
    .number()
    .int()
    .refine((v) => (EXPIRATION_ALERT_DAYS_OPTIONS as readonly number[]).includes(v), {
      message: `El intervalo de vencimiento debe ser uno de: ${EXPIRATION_ALERT_DAYS_OPTIONS.join(', ')} días`,
    })
    .optional(),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;

class SettingsService {
  getSettings(): Promise<Settings> {
    return settingsRepository.getSingleton();
  }

  async updateSettings(dto: UpdateSettingsDto): Promise<Settings> {
    const data = updateSettingsSchema.parse(dto);
    const settings = await settingsRepository.getSingleton();
    Object.assign(settings, data);
    return settingsRepository.save(settings);
  }
}

export const settingsService = new SettingsService();
