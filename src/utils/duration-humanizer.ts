import * as humanizeDuration from 'humanize-duration';

const getTimeInText = (position: number, uiConfig: any) => {
  try {
    const durationHumanizer = getDurationHumanizer(uiConfig);
    if (durationHumanizer) {
      try {
        return position ? durationHumanizer(position * 1000) : '';
      } catch (e: any) {
        return `${position}`;
      }
    }
  } catch (e: any) {
    console.log(e);
  }
};

const getDurationHumanizer = ({locale}: any) => {
  const languages = ['en'];
  if (locale) {
    if (locale.match('_')) {
      languages.unshift(locale.split('_')[0]);
    }
    languages.unshift(locale);
  }

  const supportedLanguages = new Map(humanizeDuration.getSupportedLanguages().map((language: string) => [language.toLowerCase(), language]));
  for (const language of languages) {
    try {
      if (supportedLanguages.has(language)) {
        return humanizeDuration.humanizer({language: supportedLanguages.get(language)});
      }
    } catch (e: any) {}
  }

  return null;
};

export {getTimeInText};
