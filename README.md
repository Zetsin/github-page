# Intro
1. Develop with [master](https://github.com/Zetsin/page/tree/master) branch;
2. Deploy to [gh-pages](https://github.com/Zetsin/page/tree/gh-pages) branch;
3. Store in [contents](https://github.com/Zetsin/page/tree/contents) branch;


# Usage
1. Fork this [repo](https://github.com/Zetsin/page)
2. Create `contents` branch, and setup `/src/Repos.js` with your infos:
```
export default {
  'Zetsin': [
    {
      repo: 'page',
      path: '/',
      branch: 'contents'
    }
  ]
}
```
3. install node modules
```
➜  page git:(master) ✗ npm install
```
4. deploy to github page
```
➜  page git:(master) npm run deploy
```
5. Visit your page in [https://zetsin.github.io/page/](https://zetsin.github.io/page/)
