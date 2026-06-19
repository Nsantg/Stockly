import { getDataSource } from '../lib/database';
import { Settings } from '../entity/Settings';

class SettingsRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Settings);
  }

  async getSingleton(): Promise<Settings> {
    const repo = await this.getRepo();
    const [settings] = await repo.find({ take: 1 });
    if (settings) return settings;
    return repo.save(repo.create({}));
  }

  save(settings: Settings): Promise<Settings> {
    return this.getRepo().then((repo) => repo.save(settings));
  }
}

export const settingsRepository = new SettingsRepository();
