#!/bin/env node
import * as path from 'path';
import * as fs from 'fs';
import doreamon, { date } from '@zodash/doreamon';

import api from '@cliz/core';

import { Weekly, Root, Tag } from './type';

const logger = doreamon.logger.getLogger('Build');
const todayDate = doreamon.date().format('YYYY-MM-DD');

function toCapitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

async function getDataPath() {
  return path.resolve(__dirname, '..', 'data');
}

async function getDataJSONPath() {
  return path.resolve(__dirname, '..', 'README.json');
}

async function getREADMEPath() {
  return path.resolve(__dirname, '..', 'README.md');
}

async function getTagsPath() {
  return path.resolve(__dirname, '..', 'TAGS.json');
}

async function generateOneDayMD(date: string, data: Weekly) {
  const metadata = `第 ${data.id} 期 ${data.title}
---

> 日期：${data.createdAt} 编辑：${data.editor}`;

  const top = `## ${data.content.top.title}
${data.content.top.data.map(e => doreamon.string.format(
  `- [{name}]({url}) - ${e.author.person}`,
  e,
)).join('\n')}`;

  const articles = `## ${data.content.article.title}
${data.content.article.data.map(e => doreamon.string.format(
  `- [{name}]({url}) - ${e.author.person}`,
  e,
)).join('\n')}`;

  const libraries = `## ${data.content.library.title}
${data.content.library.data.map(e => doreamon.string.format(
  `- [{name}]({url})：{description}`,
  e,
)).join('\n')}`;

  return [
    metadata,
    top,
    articles,
    libraries,
  ].join('\n\n');
}

async function generateDataJSON(dataDir: string): Promise<Root> {
  const dirs = (await api.fs.listDir(dataDir))
    .filter(f => f.isDir)
    .sort((a, b) => doreamon.date(b.name).valueOf() - doreamon.date(a.name).valueOf());

  const _data = await Promise.all(dirs.map(async dir => {
    // const files = (await api.fs.listDir(dir.absolutePath))
    //   .filter(f => !f.isDir)
    //   .filter(f => /\data.json/)

    const dataPath = api.path.join(dir.absolutePath, 'data.json');
    const readmePath = api.path.join(dir.absolutePath, 'README.md');
    const srcReadmePath = api.path.join(__dirname, '../src', `${dir.name}.md`);
    const createdAt = dir.name;
    const metadata = await api.fs.loadJSON(dataPath) as Weekly;

    const oneDayReadmeText = await generateOneDayMD(createdAt, metadata);

    // await api.fs.writeFile(readmePath, oneDayReadmeText, 'utf8');
    await api.fs.writeFile(srcReadmePath, oneDayReadmeText, 'utf8');

    return metadata;
  }));

  const total = _data.length;
  const data = [].concat(..._data);

  return {
    title: '前端观察',
    description: '一步一步向前',
    data: {
      total,
      data,
    },
  };
}

async function readDataJSON<T>(dataPath: string): Promise<T> {
  try {
    return await api.fs.loadJSON(dataPath);
  } catch (error) {
    return null;
  }
}

async function uploadDataJSON<T extends object>(dataJSONPath: string, json: T) {
  return api.fs.writeFile(
    dataJSONPath,
    JSON.stringify(json, null, 2),
    'utf-8',
  );
}

async function updateREADME(_path: string, text: string) {
  return api.fs.writeFile(_path, text, 'utf-8');
}

async function json2Readme(data: Root) {
//   const headerFormat = `# {{title}}
// > {{description}}`
//   const dateFormat = `### 第 {{id}} 期 - {{title}}`;
//   const dataItemFormat = `- [{{name}} - {{author.person}}]({{url}})`;

//   const header = doreamon.string.format(headerFormat, data, { start: '{{', end: '}}' });
  const groups = data.data.data.sort((a, b) => {
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  // // logger.debug('Found Groups:', groups);

  // const content = groups.map((group) => {
  //   // logger.debug('Found Date:', group);
  //   const title = doreamon.string.format(dateFormat, group, { start: '{{', end: '}}' });
  //   const items = [
  //     ...group.content.top.data,
  //     ...group.content.article.data
  //   ].map(item => {
  //     // logger.debug(`item:`, item);
  //     const mainText = doreamon.string.format(
  //       dataItemFormat, 
  //       item,
  //       {
  //       start: '{{', end: '}}',
  //     });

  //     return mainText;
  //   });

  //   return [
  //     title,
  //     items.join('\n'),
  //   ].join('\n');
  // }).join('\n\n');

  // return [
  //   header,
  //   content
  // ].join('\n\n');

  return `## 周刊
${groups.map(group => {
  return `- [第 ${group.id} 期 - ${group.title}](https://github.com/webafe/BAFE-Weekly/blob/master/src/${group.createdAt.replace('.', '-')}.md)`;
})}`;
}

async function onError(error) {
  logger.debug(error.message);
}

async function main() {
  const dataDirPath = await getDataPath();
  const dataJSONPath = await getDataJSONPath();
  const readmePath = await getREADMEPath();

  try {
    logger.info('开始处理...');

    logger.info(`1. 生成元数据 ... (路径: ${dataDirPath})`);
    const data = await generateDataJSON(dataDirPath);

    logger.info(`2. 写入元数据 ... (路径: ${dataJSONPath})`);
    await uploadDataJSON(dataJSONPath, data);

    logger.info('3. 数据格式转换 ...');
    const readme = await json2Readme(data);

    logger.info(`4. 更新 README ... (路径: ${readmePath})`);
    await updateREADME(readmePath, readme);

    // logger.info(`5. 更新 标签 ... (路径: ${await getTagsPath()})`);
    // await updateTags(data);
  } catch (error) {
    try {
      await onError(error);
    } catch {
      //
    }
  } finally {

  }
}

main();