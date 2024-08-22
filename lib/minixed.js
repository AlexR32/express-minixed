const path = require('node:path');
const fs = require('node:fs');

const ejs = require('ejs');
const moment = require('moment');

const templatePath = path.join(__dirname, './template.ejs');

function formatBytes(bytes, isDir, decimals = 2) {
  if (!Number(bytes)) return isDir ? '-' : '0 Bytes';
  if (bytes === 0) return isDir ? '-' : '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`;
}

class Minixed {
  constructor(publicPath = 'public') {
    this.publicPath = path.resolve(publicPath);
  }

  list(directory = '/', options = {}) {
    const { publicPath } = this;

    const {
      title = 'Index of {{path}}',
      subtitle = '{{files}} object(s) in this directory, {{size}} total',
      emptySubtitle = 'No objects in this directory',
      ignore = [],
      fileParse = 'base',
      showParent = true,
      breadcrumbs = false,
      showDirectories = true,
      showHiddenFiles = false,
      showFooter = true,
      showIcons = true,
      sizeDecimals = 2,
      alignment = 'center',
      dateFormat = 'DD/MM/YY HH:mm:ss',
      robots = 'noindex, nofollow',
      // openIndex = false
    } = options;

    return function minixedMiddleware(request, response, next) {
      const intPath = path.join(publicPath, directory, request.path).replace(/\\/g, '/');
      const pagePath = path.join(request.baseUrl, request.path).replace(/\\/g, '/');
      const webPath = path.join(directory, request.path).replace(/\\/g, '/');

      const outFiles = [];
      let filesSize = 0;

      try {
        fs.readdirSync(intPath, { withFileTypes: true }).forEach((fileDirent) => {
          const isDirectory = fileDirent.isDirectory();
          if (!showDirectories && isDirectory) return;

          const fileName = path.parse(fileDirent.name)[fileParse];
          if (!showHiddenFiles && (/^\./).test(fileName)) return;
          if (ignore.includes(fileName)) return;

          const fileStat = fs.statSync(path.join(fileDirent.parentPath, fileDirent.name));
          filesSize += fileStat.size;

          outFiles.push({
            name: fileName,
            date: moment(fileStat.mtime).format(dateFormat),
            size: formatBytes(fileStat.size, isDirectory, sizeDecimals),
            url: path.posix.join(isDirectory ? pagePath : webPath, fileName),
            isDir: isDirectory,

            realDate: fileStat.mtime,
            realSize: fileStat.size,
          });
        });
      } catch {
        return next();
      }

      let hrefPath = '';
      const hrefParts = [];
      const pathParts = pagePath.split('/').filter((part) => part !== '');
      const editedSubtitle = (outFiles.length < 1 ? emptySubtitle : subtitle)
        .replace('{{files}}', outFiles.length)
        .replace('{{size}}', formatBytes(filesSize, false, sizeDecimals));

      request.query.s = request.query.s === undefined ? 'name' : request.query.s;

      pathParts.forEach((value, index, array) => {
        hrefPath = path.posix.join(hrefPath, value);
        hrefParts.push(hrefPath);

        if (index === array.length - 1) {
          hrefPath = `/${hrefPath}`;
        }
      });

      if (request.query.s === 'name') {
        outFiles.sort((a, b) => a.name.localeCompare(b.name));
        outFiles.sort((a, b) => Number(b.isDir) - Number(a.isDir));
        if (request.query.r === '1') {
          outFiles.reverse();
        }
      } else if (request.query.s === 'date') {
        outFiles.sort((a, b) => b.realDate - a.realDate);
        outFiles.sort((a, b) => Number(b.isDir) - Number(a.isDir));
        if (request.query.r === '1') {
          outFiles.reverse();
        }
      } else if (request.query.s === 'size') {
        //outFiles.sort((a, b) => a.name.localeCompare(b.name));
        outFiles.sort((a, b) => b.realSize - a.realSize);
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

      if (showParent && pathParts.length > 1) {
        outFiles.splice(0, 0, {
          name: '..',
          date: '-',
          size: '-',
          url: path.posix.join(pagePath, '..'),
          isDir: true,
        });
      }

      ejs.renderFile(templatePath, {
        title: title.replace('{{path}}', hrefPath),
        subtitle: editedSubtitle,

        breadcrumbs: breadcrumbs,
        showFooter: showFooter,
        showIcons: showIcons,
        alignment: alignment,
        robots: robots,

        hrefPath: hrefPath,
        pathParts: pathParts,
        hrefParts: hrefParts,

        files: outFiles,
        sort: request.query.s,
        reverseSort: request.query.r,
      }, (error, html) => {
        if (error) {
          next(error);
          return;
        }

        response.send(html);
      });
    };
  }
}

module.exports = Minixed;
