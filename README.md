# Laravel Mix Modular

Compile assets for your Laravel modules from the root of your application.

In this context a Laravel module is a Composer package that can also act as a NPM package.

## Concept

A Composer package that resides in the `vendor` directory of your Laravel application.

The package also contains a `package.json` and a `module.js`.

The `package.json` is responsible for telling the application which dependencies this package needs, and you would need to pull it in to your appliactions `package.json` as such. You can do that by adding it as a file dependency.

```json
...
"foo-package": "file:./vendor/acme/foo"
...
```

The `module.js` contains an object that tells this plugin which entries it wants compiled, and which vendors to extract.

```js
module.exports = {
    vendors: ['vue'],

    entries: {
        'app.js': 'foo.js',
        'app.scss': 'foo.css'
    }
};
```

Please be aware that using the extraction does not work with using extract in your application itself.

## Using it

```js
const mix = require('laravel-mix');
require('laravel-mix-modular');

mix
    .js('resources/js/app.js', 'public/js')
    .sass('resources/sass/app.scss', 'public/css')
    .modular({
        vendor: 'acme'
    });
```

This will build all modules that have a `module.js` file to the public directory set by Mix. Usually this will result in `public/js/modules/foo.js` and `public/css/modules/foo.css`.

You can modify the default options by passing an object as the second argument.

```js
{
    extract: true, // controls whether vendor extraction is enabled
    entryFile: 'module.js', // the file to look for when finding modules
    resourcesDirectory: 'resources', // where assets are located in your modules
    modulesPath: 'modules', // the directory when compiled module assets land
    path: 'vendor', // the path to the directory where your modules are located
}
```

