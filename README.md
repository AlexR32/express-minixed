# express-minixed
Minimal and nice-looking directory indexer but now ported to JavaScript (Express Middleware)  
Original idea was taken from [lorenzos@Minixed](https://github.com/lorenzos/Minixed)

## What changed?
- Ported to Express Middleware
- EJS template engine
- New dark mode (colors inverted)
- New SVG icons

## Installation
This is Express Middleware so make sure to [install express](https://github.com/expressjs/express?tab=readme-ov-file#installation) first  
You can install this package through [npm](https://www.npmjs.com/)
```
npm install express-minixed
```

## Documentation / Example
Once installed and imported into your code  
You must initialize Minixed with your public (static) path

```javascript
const Minixed = require('express-minixed');
const express = require('express');
const path = require('node:path');

// Getting public path
const publicPath = path.join(__dirname, 'public');

const app = express();

// Setting public path to express
app.use(express.static(publicPath));

// Initialize Minixed
const minixed = new Minixed(publicPath);
```

Once Minixed has successfully initialized, you can use it.

```javascript
...

const appPath = 'whatever/path/you/want';
const actualPath = 'actual/path/where/files/stored/in/public/path';
app.use(appPath, minixed.list(actualPath, {
  fileParse: 'name',
  showDirectories: false,
  showIcons: false
}))
```

### Options
#### title
Sets title of Minixed and can display current path  
Default: `Index of {{path}}`
#### subtitle
Sets subtitle that can display number of files in directory and its total size  
Default: `{{files}} object(s) in this directory, {{size}} total`
#### emptySubtitle
Sets subtitle text when there is no files in directory can display files and size like subtitle option  
Default: `No objects in this directory`
#### ignore
Array of file names to ignore  
Sensetive to fileParse option  
Default: `[] (Empty Array)`
#### fileParse
Displays what the file name will look like  
Base will display file name and its extension    
Name will display only file name  
For more info see [path docs](https://nodejs.org/api/path.html#pathparsepath)  
Default: `base`  
Options: `base, name`
#### showParent
Shows parent directory (`.. /`) if you are in sub directory  
Default: `true`
#### breadcrumbs
Divides the path into subdirectories that you can navigate through  
Default: `false`
#### showDirectories
Shows directories  
Default: `true`
#### showHiddenFiles
Shows hidden files  
Default: `false`
#### showFooter
Shows credit footer  
Don't turn it off if you want to support the project  
Default: `true`
#### showIcons
Shows icons before the file name  
Default: `true`
#### sizeDecimals
displays how many decimals the file size value should show  
Default: `2`
#### alignment
How the interface should be aligned  
Default: `center`
Options: `left, center, right`
#### dateFormat
Format of file date  
For more info about format see [moment docs](https://momentjs.com/docs/#/displaying/format/)
Default: `DD/MM/YY HH:mm:ss`
#### robots
HTML meta to disable search robots  
Default: `noindex, nofollow`
