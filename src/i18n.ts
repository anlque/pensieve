import type { LanguageName } from './config';

export type TranslationKey =
  | 'app.title'
  | 'app.description'
  | 'info.button'
  | 'settings.button'
  | 'settings.wallpaper'
  | 'settings.language'
  | 'wallpaper.forest'
  | 'wallpaper.moon'
  | 'wallpaper.deep'
  | 'wallpaper.embers'
  | 'wallpaper.office'
  | 'wallpaper.library'
  | 'wallpaper.quidditch'
  | 'wallpaper.custom'
  | 'wallpaper.upload'
  | 'info.close'
  | 'info.title'
  | 'info.summary'
  | 'info.item.add'
  | 'info.item.mix'
  | 'info.item.edit'
  | 'info.item.wallpaper'
  | 'hero.title'
  | 'hero.subtitle'
  | 'back'
  | 'thought.label'
  | 'thought.placeholder'
  | 'thought.submit'
  | 'thought.preview'
  | 'letGo'
  | 'mix'
  | 'mix.close'
  | 'modal.label'
  | 'modal.close'
  | 'modal.actions'
  | 'modal.edit'
  | 'modal.delete'
  | 'modal.editLabel'
  | 'modal.save'
  | 'modal.cancel'
  | 'completion.title'
  | 'completion.text'
  | 'wand.button'
  | 'home.cta';

export const translations: Record<LanguageName, Record<TranslationKey, string>> = {
  ru: {
    'app.title': 'Омут памяти',
    'app.description': 'Омут памяти — спокойное приложение для выгрузки мыслей, их перемешивания, редактирования и отпускания.',
    'info.button': 'Информация',
    'settings.button': 'Настройки фона',
    'settings.wallpaper': 'Обои',
    'settings.language': 'Язык',
    'wallpaper.forest': 'Лес',
    'wallpaper.moon': 'Луна',
    'wallpaper.deep': 'Глубина',
    'wallpaper.embers': 'Искры',
    'wallpaper.office': 'Кабинет',
    'wallpaper.library': 'Библиотека',
    'wallpaper.quidditch': 'Игровое поле',
    'wallpaper.custom': 'Своя картинка',
    'wallpaper.upload': 'Загрузить свою картинку для обоев',
    'info.close': 'Закрыть информацию',
    'info.title': 'Омут памяти',
    'info.summary': 'Место, куда можно выгрузить мысли, чтобы стало легче.',
    'info.item.add': 'Введи мысль и отпусти её в омут палочкой.',
    'info.item.mix': 'Перемешай омут, чтобы рассмотреть мысли ближе.',
    'info.item.edit': 'Открой мысль, измени её или удали.',
    'info.item.wallpaper': 'Смени обои через настройки справа.',
    'hero.title': 'Омут<br />памяти',
    'hero.subtitle': 'Твои мысли важны.<br />Выгрузи их. Отпусти.',
    back: 'Назад',
    'thought.label': 'Мысль',
    'thought.placeholder': 'Вытащи мысль...',
    'thought.submit': 'Поймать мысль',
    'thought.preview': 'Нужно позвонить маме',
    letGo: 'Отпустить мысли',
    mix: 'Перемешать',
    'mix.close': 'Закрыть омут',
    'modal.label': 'Мысль',
    'modal.close': 'Закрыть мысль',
    'modal.actions': 'Действия с мыслью',
    'modal.edit': 'Изменить',
    'modal.delete': 'Удалить',
    'modal.editLabel': 'Редактировать мысль',
    'modal.save': 'Сохранить',
    'modal.cancel': 'Отмена',
    'completion.title': 'Стало легче',
    'completion.text': 'Мысли отпущены. Можно выдохнуть.',
    'wand.button': 'Взять мысль палочкой',
    'home.cta': 'Коснись и начни<br />выгружать мысли',
  },
  en: {
    'app.title': 'Memory Bowl',
    'app.description': 'Memory Bowl is a calm app for unloading, mixing, editing, and releasing thoughts.',
    'info.button': 'Information',
    'settings.button': 'Background settings',
    'settings.wallpaper': 'Wallpaper',
    'settings.language': 'Language',
    'wallpaper.forest': 'Forest',
    'wallpaper.moon': 'Moon',
    'wallpaper.deep': 'Depth',
    'wallpaper.embers': 'Embers',
    'wallpaper.office': 'Study',
    'wallpaper.library': 'Library',
    'wallpaper.quidditch': 'Playing field',
    'wallpaper.custom': 'Custom image',
    'wallpaper.upload': 'Upload your own wallpaper image',
    'info.close': 'Close information',
    'info.title': 'Memory Bowl',
    'info.summary': 'A quiet place to unload thoughts when your mind feels crowded.',
    'info.item.add': 'Write a thought and release it into the bowl with the wand.',
    'info.item.mix': 'Mix the bowl to look at your thoughts up close.',
    'info.item.edit': 'Open a thought to edit it or delete it.',
    'info.item.wallpaper': 'Change the wallpaper from the settings on the right.',
    'hero.title': 'Memory<br />Bowl',
    'hero.subtitle': 'Your thoughts matter.<br />Unload them. Let go.',
    back: 'Back',
    'thought.label': 'Thought',
    'thought.placeholder': 'Pull out a thought...',
    'thought.submit': 'Catch thought',
    'thought.preview': 'Need to call mom',
    letGo: 'Release thoughts',
    mix: 'Mix',
    'mix.close': 'Close bowl',
    'modal.label': 'Thought',
    'modal.close': 'Close thought',
    'modal.actions': 'Thought actions',
    'modal.edit': 'Edit',
    'modal.delete': 'Delete',
    'modal.editLabel': 'Edit thought',
    'modal.save': 'Save',
    'modal.cancel': 'Cancel',
    'completion.title': 'A little lighter',
    'completion.text': 'Your thoughts are released. Take a slow breath.',
    'wand.button': 'Take a thought with the wand',
    'home.cta': 'Touch to start<br />unloading thoughts',
  },
};
