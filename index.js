const mix = require('laravel-mix');
const path = require('path');
const FileSet = require('file-set')
const { NormalModuleReplacementPlugin } = require('webpack')
const rootPath = Mix.paths.root.bind(Mix.paths);

class ModularMix {
    name() {
        return ['modular'];
    }

    dependencies() {
        this.requiresReload = true;

        return ['file-set'];
    }

    register(vendor, options = {}) {
        this.vendor = vendor;
        this.options = Object.assign(
            {
                extract: true,
                entryFile: 'module.json',
                resourcesDirectory: 'resources',
                modulesPath: 'modules',
                path: 'vendor',
            },
            options
        );

        let vendors = [];
        this.getModules().forEach(file => {
            let module = require(file);
            if(module.hasOwnProperty('vendors')) {
                vendors = vendors.concat(module.vendors)
            }
            if(module.hasOwnProperty('entries')) {
                this.compileModule(module, file);
            }
        });

        if (this.options.extract && vendors.length > 0) {
            mix.extract(vendors.filter((value, index, self) => {
                return self.indexOf(value) === index;
            }), 'public/js/vendor.js');
        }
    }

    compileModule(module, file) {
        let resourcesPath = this.getResourcesPath(file);

        Object.keys(module.entries).forEach(source => {
            let entry = module.entries[source]
            let extension = this.getExtension(source)

            if (extension === 'js') {
                mix.js(`${resourcesPath}/js/${source}`, `${Config.publicPath}/js/${this.options.modulesPath}/${entry}`)
            } else if (extension === 'scss') {
                mix.sass(`${resourcesPath}/sass/${source}`, `${Config.publicPath}/css/${this.options.modulesPath}/${entry}`)
            } else if (extension === 'styl') {
                mix.stylus(`${resourcesPath}/stylus/${source}`, `${Config.publicPath}/css/${this.options.modulesPath}/${entry}`)
            } else if (extension === 'less') {
                mix.less(`${resourcesPath}/less/${source}`, `${Config.publicPath}/css/${this.options.modulesPath}/${entry}`)
            }
        })
    }

    injectModules(module, file, plugins) {
        let currentModule = this.getModuleName(file)

        if(module.hasOwnProperty('replace')) {
            Object.keys(module.replace).forEach(find => {
                let inject = module.replace[find]
                let [parentModule, file] = find.split('@')

                let parentFilePath = '^.*' + rootPath(`${this.options.path}/${this.vendor}/${parentModule}/${this.options.resourcesDirectory}/${file}`).replace(new RegExp('/', 'g'), '\\/') + '.*$';
                let replaceFilePath = rootPath(`${this.options.path}/${this.vendor}/${currentModule}/${this.options.resourcesDirectory}/${inject}`);

                plugins.push(
                    new NormalModuleReplacementPlugin(
                        new RegExp(parentFilePath),
                        replaceFilePath
                    )
                )
            })
        }

    }

    getModuleName(file) {
        let directory = path.dirname(file)
        let base = new String(directory).substring(directory.lastIndexOf('/') + 1);
        if (base.lastIndexOf(".") !== -1) {
            base = base.substring(0, base.lastIndexOf("."))
        }
        return base;
    }

    getExtension(filename) {
        var i = filename.lastIndexOf('.');
        return (i < 0) ? '' : filename.substr(i + 1);
    }

    getResourcesPath(file) {
        return path.dirname(file) + '/' + this.options.resourcesDirectory;
    }

    getModules() {
        let modulesPath = rootPath(`${this.options.path}/${this.vendor}/**/*/${this.options.entryFile}`);
        let modules = new FileSet(modulesPath);

        return modules.files;
    }

    webpackConfig(config) {
        this.getModules().forEach(file => {
            let module = require(file);
            config.resolve.alias['@' + this.getModuleName(file)] = this.getResourcesPath(file)
        })

        config.resolve.symlinks = false
        return config
    }

    webpackPlugins() {
        let plugins = [];

        this.getModules().forEach(file => {
            let module = require(file);
            this.injectModules(module, file, plugins);
        })

        return plugins
    }
}

mix.extend('modular', new ModularMix());
