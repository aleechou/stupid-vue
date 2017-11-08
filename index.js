const walk = require("walk")
const fs = require("fs")
const compiler = require('vue-component-compiler')
const Path = require("path")
const babel = require("babel-core")
const Vuex = require("vuex")

exports.regiterFolder = function(folder, Vue) {

    return new Promise((resolve) => {

        walker = walk.walk(folder, { followLinks: false })

        walker.on('file', function(root, stat, next) {
            // Add this file to the list of files if it matches .log
            if (stat.name.match('.vue')) {

                let path = root + "/" + stat.name

                compiler.compile(fs.readFileSync(path).toString(), path, function(err, result) {

                    if (err) {
                        console.error(err)
                        next()
                        return
                    }

                    let prefix = Path.relative(folder, root).replace(/[\/\\]/g, ".")
                    if (prefix) prefix += "."
                    let tagName = prefix + stat.name.replace(/.vue$/i, '')

                    result = babel.transform(result, {
                        presets: ["es2015"]
                    }).code

                    result = "(function(){module={exports:{}}; exports=module.exports;\n\n" + result + "\nreturn module.exports\n})()"
                    let component = eval(result)

                    component.template = "<div>" + component.template + "</div>"

                    if (component.mapState) {
                        component.computed = Vuex.mapState(component.mapState)
                    }

                    console.log(result)

                    Vue.component(tagName, component)

                    next()
                })
            } else {
                next()
            }

        })

        walker.on('end', resolve)
    })
}


var consoleerror = console.error
console.error = function(msg) {
    if (msg.match("Component names can only contain alphanumeric characters and the hyphen, and must start with a letter")) {
        return
    }
    return consoleerror.apply(console, arguments)
}