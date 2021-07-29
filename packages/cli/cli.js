#!/usr/bin/env node

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Gk6xDevice, getInfoFromLEBuffer } from '@gk6x/core'
import { promises as fs } from 'fs'

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