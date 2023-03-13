const fs = require('fs');
const { text } = require('stream/consumers');

const url = 'https://graph.whatsapp.com/graphql/catalog';

const data = {
  access_token: "WA|787118555984857|7bb1544a3599aa180ac9a3f7688ba243",
  doc_id: "5456143974442934",
  variables: {
    request: {
      product_catalog: {
        jid: "573118931877@c.us",
        allow_shop_source: "ALLOWSHOPSOURCE_FALSE",
        width: "100",
        height: "100",
        limit: "10"
      }
    }
  },
  lang: "en_GB"
};

const config = {
  method: 'POST',
  body: JSON.stringify(data),
  headers: {
    'Content-Type': 'application/json',
    'Origin': "https://web.whatsapp.com",
    'Referer': 'https://web.whatsapp.com'

  }
};

// Obtener catalogo mediante fetch
async function getCatalog() {
  let news = [];

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    const products = data.data.xwa_product_catalog_get_product_catalog.product_catalog.products;

    let id = 0;

    products.forEach(item => {
      let images = [];
      item.media.images.forEach(image => {
        images.push(image.original_image_url);
      });
      news.push({ 'id': id, 'name': item.name, 'description': item.description, 'images': images, 'price': item.price });
      id++;
    });
    return news;

  } catch (error) {
    throw new Error(error);
  }
}

//archivo JSON con los autos
async function getJSON_DB(data) {
  let text = await data;
  let fileText = "";
  const fileName = 'DB.json';
  let  json = "";
  await text.forEach(item => {
    fileText = catalogFormat(item);
    json +=  JSON.stringify(fileText, null, 4) + ",";
  });

  console.log(json);
  
  try {
    fs.writeFile(fileName, json, (err) => {
      if (err) {
        console.error('Error al escribir en el archivo:', err);
      } else {
        console.log('Archivo guardado exitosamente.');
      }
    });
  } catch (error) {
    console.error('Error al convertir los datos a formato JSON:', error);
  }
}

//Funcion para dar formato a JSON del texto del catalogo
function catalogFormat(item) {
  //Variables para el JSON
  let id, mark, model, year, price, color, others, plate;

  //Regex para los atributos de los autos
  const regexMark = /\b(Toyota|Nissan|Honda|Ford|Chevrolet|Renault|Kia|Peugeot|BMW|Mazda|Mitsubishi)\b/gi;
  const regexColor = /(?:COLOR\s*)(\S.*?)\s*\n/i;
  const regexYear = /[0-9]{4}/;
  const regexPlate = /PLACAS DE\s(.+?)\n/i;
  const regexModel = /\b\w+\b/g;
  const regexDetails = /\n|(PLACAS DE[\s\S]*?✅)|(COLOR[\s\S]*?✅)|\nEN EL VALOR VA INCLUIDO LOS GASTOS TOTALES DE TRASPASO E IMPUESTOS AL 2022 YA PAGOS\n\n🎊CONTAMOS CON SISTEMA DE FINANCIACION🎊/mig;

  //Encuentra coincidencias y elimina ciertos caracteres o frases innecesarias
  id = item.id;
  mark = item.name.match(regexMark);
  color = item.description.match(regexColor);
  color[0] = color[0].slice(0, -1).replace("COLOR ", "");
  model = item.name.match(regexModel);
  year = item.name.match(regexYear);
  plate = item.description.match(regexPlate);
  plate = plate[0].slice(0, -1).replace("PLACAS DE ", "")
  price = item.price / 1000;
  others = item.description.replace(/\n{2}[\s\S]*/, "\n\n");
  others = others.replace(regexDetails, "");
  others = others.split("✅");
  others.splice(0, 1);

  //console.log(item.description);
  //Modelo de JSON
  details = ({
    'id': id,
    'mark': mark[0],
    'model': model[1],
    'year': year[0],
    'price': price,
    'color': color[0],
    'images': item.images,
    'plate': plate,
    'others': others
  });
  return details;
}




async function downloadImage(uri, path, filename) {
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // console.log(buffer);
  fs.writeFileSync(`${path}/${filename}`, buffer, function (err) {
    if (err) throw err;
    console.log(`Archivo ${filename} guardado en ${path}`);
  });

};

//Recorrer imagenes de vehiculo
async function getImages() {
  let data = await getCatalog();
  let id = 0;
  let dir = 'media';

  //Crea la carpeta media 
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  //Recorre cada uno de los datos
  data.forEach(item => {
    let dir = `media/${id}`;
    let filename = `${item.id}.png`;

    //crea la carpeta para un item
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    id++;
    //recorre cada uno de los links de cada item
    item.images.forEach((image, index) => {
      const filename = `${item.id}_${index}.png`;
      downloadImage(image, dir, filename);
    });
  });
}

getImages();
getJSON_DB(getCatalog());
