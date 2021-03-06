# Итоги переписи русскоязычного LessWrong

В этом репозитории хранится исходный код для обработки и отображения результатов переписи LessWrong.ru в 2015 и 2016 годах.

Итоги переписи:

* [2015](http://lesswrong.ru/survey/2015/)
* [2016](http://lesswrong.ru/survey/2016/)

Ради удобства (выкладки на github pages и т.п.) некоторые сгенерированные файлы закоммичены в репозиторий:

* nojs.html - статическая версия результатов переписи (сделанная через save as... в браузере)
* built/bundle.js и built/normalize.css - сгенерированные через npm run build, который запускает webpack и копирует css-файл из node_modules
* original-survey.pdf с pdf-копией оригинального опроса

Где что находится:

* data.js - js-файл с большим js-объектом со всеми данными
* data/extract_json.py - генерирует data.js из data/data.txt (которого в репозитории нет, потому что в нём есть персональные данные участников опроса)
* index.html - главная страница, ничего не делает сама по себе, но подгружает bundle.js
* built/bundle.js - собранный с помощью webpack js-код на react и d3.js
* main.js - исходный код для bundle.js
* nojs.html - статическая версия результатов переписи
