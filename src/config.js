// src/config.js
import waterImage from './assets/water.jpg';
import cocaColaImage from './assets/cocacola.png';
import cocaColaZeroImage from './assets/cocacolazero.jpg';
import xlImage from './assets/xl.jpeg';
import nabeghlaviImage from './assets/nabeglavi.jpeg';
import tonicImage from './assets/tonic.jpg';
import kayakImage from './assets/kayak.jpg';
import lowenbrauImage from './assets/lowenbrau.jpeg';
import qarvaImage from './assets/karva.jpg';
import ginTonicImage from './assets/jintonic.jpg';
import aperolSpritzImage from './assets/aperoll.jpg';
import martiniBlancoImage from './assets/martini.jpg';
import jagerCherryImage from './assets/jagerJuice.jpg';
import jagerShotImage from './assets/jagershot.jpg';
import naturalJuiceImage from './assets/juice.jpg';
import mimosaImage from './assets/mimosa.jpg';
import hotDogImage from './assets/hotdog.jpg';
import popcornImage from './assets/popcorn.jpg';

export const HOURLY_RATE = 16;
export const TABLE_COUNT = 9;
export const LOCAL_STORAGE_TABLES_KEY = "pingPongTablesData_v2";
export const LOCAL_STORAGE_HISTORY_KEY = "pingPongSessionHistory_v1";
export const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxEI9gdf7kWAiLMlhxABmGQPosESnD5iI6VCPwLVdD4ICbXs-ToHuucNNj8cSIS0_a7YQ/exec";

export const ITEMS = [
    {
        name: 'Water',
        price: 2,
        image: waterImage
    },
    {
        name: 'Coca-Cola',
        price: 3.5,
        image: cocaColaImage
    },
    {
        name: 'Zero',
        price: 3.0,
        image: cocaColaZeroImage
    },
    {
        name: 'XL',
        price: 5.5,
        image: xlImage
    },
    {
        name: 'Nabeghlavi',
        price: 4.0,
        image: nabeghlaviImage
    },
    {
        name: 'Natural Juice',
        price: 5.0,
        image: naturalJuiceImage
    },
    {
        name: 'Tonic',
        price: 5.0,
        image: tonicImage
    },
    {
        name: 'Kayak',
        price: 11.0,
        image: kayakImage
    },
    {
        name: 'Lowenbrau',
        price: 11.0,
        image: lowenbrauImage
    },
    {
        name: 'Qarva',
        price: 11.0,
        image: qarvaImage
    },
    {
        name: 'Gin & Tonic',
        price: 14.0,
        image: ginTonicImage
    },
    {
        name: 'Aperol Spritz',
        price: 14.0,
        image: aperolSpritzImage
    },
    {
        name: 'Martini Blanco',
        price: 19.0,
        image: martiniBlancoImage
    },
    {
        name: 'Jager Cherry',
        price: 13.0,
        image: jagerCherryImage
    },
    {
        name: 'Jager Shot',
        price: 10.0,
        image: jagerShotImage
    },
    {
        name: 'Mimosa',
        price: 10.0,
        image: mimosaImage
    },
    {
        name: 'Hot Dog',
        price: 8,
        image: hotDogImage
    },
    {
        name: 'Popcorn',
        price: 5,
        image: popcornImage
    }
];