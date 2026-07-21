import { LANGUAGES, Language } from '../app/strings';

/** Remembers the chosen UI language across reloads. */
export class LanguageStore {
  private active: Language;

  constructor(
    private readonly key: string,
    private readonly storage: Storage,
  ) {
    const stored = this.storage.getItem(this.key) as Language | null;
    this.active = stored && LANGUAGES.includes(stored) ? stored : LANGUAGES[0];
  }

  get language(): Language {
    return this.active;
  }

  /** Advances to the next language (wraps) and persists it. */
  cycle(): Language {
    const index = LANGUAGES.indexOf(this.active);
    this.active = LANGUAGES[(index + 1) % LANGUAGES.length];
    this.storage.setItem(this.key, this.active);
    return this.active;
  }
}
