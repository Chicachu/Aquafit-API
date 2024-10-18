import i18n from 'i18n';
import path from 'path';

// Configure i18n
i18n.configure({
  locales: ['en', 'es'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  autoReload: true,
  updateFiles: false,
  objectNotation: true
});

export default i18n;