#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs').promises

// stupid hack to make pkg work
const { Gk6xDevice, getInfoFromLEBuffer } = require('./node_modules/@gk6x/core')

function convertLEtoPixeltris(source) {}

function convertPixeltrisToLE(source) {}

yargs(hideBin(process.argv))  
  .command('config <file>', 'Use le or pixeltris config format (easier to use) to setup your keyboard', () => {}, async (argv) => {
    console.error('Not implemented yet. Check back, soon.')
  })
  
  .command('convert <fileA> <fileB>', 'Convert to/from pixeltris and official le', () => {}, async (argv) => {
    console.error('Not implemented yet. Check back, soon.')
  })
  
  .command('apple', "Force your keyboard to pretend it's an official apple keyboard", () => {}, (argv) => {
    try{
      const k = new Gk6xDevice()
      k.writeMacVid()
      k.close()
    } catch(e) {
      console.error("There was an issue opening a normal keyboard to put it in fake-apple mode. Maybe it's already in apple-mode? You might also need to run with sudo or something.")
    }
  })
  
  .command('normal', "Remove the weird apple setup", () => {}, (argv) => {
    try{
      Gk6xDevice.writeNormalVid()
    } catch(e) {
      console.error("There was an issue opening a fake apple keyboard to put it in normal mode. Maybe it's already in normal-mode? You might also need to run with sudo or something.")
    }
  })
  .demandCommand(1)
  .argv