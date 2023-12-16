const ejs = require('ejs');
const moment = require('moment');
const path = require('node:path');
const fs = require('node:fs');

const templatePath = path.join(__dirname, 'template.ejs');

function formatBytes(bytes, isDir, decimals = 2) {
  if (!+bytes) return isDir ? '-' : '0 Bytes';
  if (bytes == 0) return isDir ? '-' : '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

class Minixed {
  constructor(publicPath) {
    this.publicPath = publicPath;
  }

  list(directory = '/', options = {}) {
    options.title = options.title || 'Index of {{path}}';
    options.subtitle = options.subtitle || '{{files}} object(s) in this directory, {{size}} total';
    options.emptySubtitle = options.emptySubtitle || 'No objects in this directory';

    options.ignore = options.ignore || [];
    options.fileParse = options.fileParse || 'base';
    options.showParent = options.showParent || true;
    options.breadcrumbs = options.breadcrumbs || false;
    options.showDirectories = options.showDirectories || true;
    options.showHiddenFiles = options.showHiddenFiles || false;
    options.showFooter = options.showFooter || true;

    options.showIcons = options.showIcons || true;
    options.sizeDecimals = options.sizeDecimals || 2;
    options.alignment = options.alignment || 'center';
    options.dateFormat = options.dateFormat || 'DD/MM/YY HH:mm:ss';
    options.robots = options.robots || 'noindex, nofollow';
    //options.openIndex = options.openIndex || false;

    const publicPath = this.publicPath;

    return function(request, response, next) {
      const intPath = path.join(publicPath, directory, request.path);
      const webPath = path.join(directory, request.path).replace(/\\/g, '/');
      const pagePath = path.join(request.baseUrl, request.path).replace(/\\/g, '/');

      const outFiles = [];
      let filesSize = 0;

      try {
        fs.readdirSync(intPath, { withFileTypes: true }).forEach(function(fileDirent) {
          const isDirectory = fileDirent.isDirectory();
          if (!options.showDirectories && isDirectory) return;

          const fileName = path.parse(fileDirent.name)[options.fileParse];
          if (!options.showHiddenFiles && /^\./.test(fileName)) return;

          const fileStat = fs.statSync(path.join(fileDirent.path, fileDirent.name));
          filesSize += fileStat.size;

          outFiles.push({
            _date: fileStat.mtime,
            _size: fileStat.size,

            name: fileName,
            isDir: isDirectory,
            date: moment(fileStat.mtime).format(options.dateFormat),
            size: formatBytes(fileStat.size, isDirectory, options.sizeDecimals),
            url: path.posix.join(isDirectory ? pagePath : webPath, fileName)
          });
        });
      } catch {
        return next();
      }

      let hrefPath = '';
      const hrefParts = [];
      const pathParts = pagePath.split('/').filter(part => part !== '');
      const subtitle = (outFiles.length < 1 ? options.emptySubtitle : options.subtitle)
        .replace('{{files}}', outFiles.length)
        .replace('{{size}}', formatBytes(filesSize, false, options.sizeDecimals));

      request.query.s = request.query.s == undefined ? 'name' : request.query.s;

      pathParts.forEach(function(value, index, array) {
        hrefPath = path.posix.join(hrefPath, value);
        hrefParts.push(hrefPath);

        if (index === array.length - 1) {
          hrefPath = '/' + hrefPath;
        };
      });

      if (request.query.s === 'name') {
        outFiles.sort((a, b) => a.name.localeCompare(b.name));
        outFiles.sort((a, b) => Number(b.isDir) - Number(a.isDir));
        if (request.query.r === '1') {
          outFiles.reverse();
        }
      } else if (request.query.s === 'date') {
        outFiles.sort((a, b) => b._date - a._date);
        outFiles.sort((a, b) => Number(b.isDir) - Number(a.isDir));
        if (request.query.r === '1') {
          outFiles.reverse();
        }
      } else if (request.query.s === 'size') {
        //outFiles.sort((a, b) => a.name.localeCompare(b.name));
        outFiles.sort((a, b) => b._size - a._size);
        if (request.query.r === '1') {
          outFiles.reverse();
        }
      } else {
        outFiles.sort((a, b) => a.name.localeCompare(b.name));
        outFiles.sort((a, b) => Number(b.isDir) - Number(a.isDir));
        if (request.query.r === '1') {
          outFiles.reverse();
        }
      }

      if (options.showParent && pathParts.length > 1) {
        outFiles.splice(0, 0, {
          name: '..',
          url: path.posix.join(pagePath, '..'),
          date: '-',
          size: '-',
          isDir: true
        });
      }

      ejs.renderFile(templatePath, {
        title: options.title.replace('{{path}}', hrefPath),
        subtitle: subtitle,

        breadcrumbs: options.breadcrumbs,
        showFooter: options.showFooter,
        showIcons: options.showIcons,
        alignment: options.alignment,
        robots: options.robots,

        hrefPath: hrefPath,
        pathParts: pathParts,
        hrefParts: hrefParts,

        files: outFiles,
        sort: request.query.s,
        reverseSort: request.query.r
      }, function(error, html) {
        if (error) next(error);
        response.send(html);
      });
    }
  }
}

exports = module.exports = Minixed;
