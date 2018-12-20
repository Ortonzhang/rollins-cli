#! /usr/bin/env node 
const program = require('commander')
const { prompt } = require('inquirer')
const chalk = require('chalk')
const download = require('download-git-repo')
const fs = require('fs')
const ora = require('ora')
const { promisify } = require('util');
const path = require('path')

// 使用 promisify 设置成promise
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile)

// 模版配置文件
const templateConfig = require(`${__dirname}/../template`)

// 获取当前设备的路径分割符号
const sep = path.sep

// 设置问题
const promptList = [
  {
    type: 'input',
    name: 'name',
    message: '请输入文件夹名',
    filter: function(val) {
      return val.trim()
    },
    validate: function(val) {
      return !!val.trim() ? true : '请输入名称'
    }
  },
  {
    type: 'list',
    name: 'template',
    message: '请选择模版',
    choices: [
      'dva',
      'umi'
    ]
  }
]


const create = async () => {

  // 获取用户输入 拿到项目名和模版
  let { name, template } = await prompt(promptList)
  
  // 判断Linux和windows 设置不同的分隔符
  let step = sep === '/' ? '/' : '\\'

  console.log(`
    ${chalk.white(`✨ Creating project in ${chalk.yellow(`${process.cwd()}${step}${name}`)}.`)}
  `)

  const spinner = ora('🗃 Initializing git repository...');

  spinner.start()
  
  // 下载模版
  await downloadPromise(`${templateConfig[template]}`, `${name}`)
  
  // 获取模版的package.json文件数据
  let stringPackage = await readFileAsync(`./${name}/package.json`, {encoding: 'utf8'})
  
  // 转化成json
  let jsonPackage = JSON.parse(stringPackage)
  
  // 设置名称
  jsonPackage.name = `${name}`

  // 创建新的json数据
  const updateJson = JSON.stringify(jsonPackage, null, 2)

  // 写入新的package.json
  await writeFileAsync(`./${name}/package.json`, updateJson)

  spinner.stop();

  console.log(`
    ${chalk.green(`🎉  Successfully created project ${chalk.yellow(`${name}`)}.`)}
    ${chalk.white('👉  Get started with the following commands:')}
    ${chalk.cyan(`
      ${chalk.gray('$')} cd ${name}
      ${chalk.gray('$')} npm install
      ${chalk.gray('$')} npm start
    `)}
  `);
}

// create()


/**
 * 下载模版
 * @param {String} path  模版路径
 * @param {String} name  项目名称
 * @return {Promise}  promise对象
 */
const downloadPromise = (path, name) => {
  return new Promise((resolve, reject) => {
    download(path, name, (err) => {
      if(err){
        console.log(chalk.red(err))
        reject()
      }
      resolve()
    })
  })
}

program
  
  // 版本号 
  .version(require('../package').version)

  // 设置命令
  .command('create')
  
  //设置别名
  .alias('c')
  
  // 描述
  .description('创建新项目')
  
  // 动作
  .action(option => {
    create()
  })

program.parse(process.argv)

// 输入为空时 显示帮助信息
if(!program.args.length){
  program.help()
}




