
/* editor.js */

/* Imports */

// n/a

/* Document */

const canvas = document.getElementById("editor")
const ctx = canvas.getContext("2d", { alpha: true, willReadFrequently: true })

if (ctx == null) {
    console.log("Your browser doesn't support canvases!")
    alert("Your browser doesn't support canvases!")
    exit()
}
ctx.imageSmoothingEnabled = false

/* Document Settings/Inputs */

function getCheckboxInput(id) {
    const checkbox = document.getElementById(id)
    console.assert(checkbox != null, "Failed to find checkbox input '" + id + "'!")
    return {
        set(value) {
            checkbox.value = value
        },
        get() {
            return checkbox.checked
        },
        changed(event) {
            checkbox.addEventListener('change', event)
        }
    }
}

function getNumberInput(id) {
    const numberi = document.getElementById(id)
    console.assert(numberi != null, "Failed to find number input '" + id + "'!")
    return {
        set(value) {
            numberi.value = value
        },
        get() {
            return parseInt(numberi.value)
        },
        changed(event) {
            numberi.addEventListener('change', event)
        },
    }
}

function getFileInput(id) {
    const filei = document.getElementById(id)
    console.assert(filei != null, "Failed to find file input '" + id + "'!")
    return {
        get() {
            return filei.files[0]
        },
        changed(event) {
            filei.addEventListener('change', event)
        },
    }
}

function getListBox(id) {
    const listi = document.getElementById(id)
    console.assert(listi != null, "Failed to find list input '" + id + "'!")
    return {
        get() {
            return listi.value
        },
        changed(event) {
            listi.addEventListener('change', event)
        },
    }
}

/*
const gridEnabled               = getCheckboxInput  ("OPTION_enableGrid")
const gridLinesEnabled          = getCheckboxInput  ("OPTION_enableGridLines")
const gridSize                  = getNumberInput    ("OPTION_gridSize")
const borderCollisionsEnabled   = getCheckboxInput  ("OPTION_borderCollisions")*/
const file                      = getFileInput      ("OPTION_file")
const image_preview             = getCheckboxInput  ("OPTION_preview")
const lcd_preset                = getListBox        ("OPTION_lcdPreset")
const custom_size_x             = getNumberInput    ("OPTION_custom_x")
const custom_size_y             = getNumberInput    ("OPTION_custom_y")
const dithering                 = getCheckboxInput  ("OPTION_floyddither")
const compress                  = getCheckboxInput  ("OPTION_compress")

/* Screens */

const BIT_SPACING = 255 / 7

function getChar(r, g, b, a) {
    r *= a / 255
    g *= a / 255
    b *= a / 255
    return String.fromCharCode(0xe100 + (Math.round(r / BIT_SPACING) << 6) + (Math.round(g / BIT_SPACING) << 3) + (Math.round(b / BIT_SPACING)))
}

function getColor(r, g, b) {
    return [Math.round(r / BIT_SPACING) * BIT_SPACING, Math.round(g / BIT_SPACING) * BIT_SPACING, Math.round(b / BIT_SPACING) * BIT_SPACING]
}

function getColorDec(rgb) {
    return ((Math.round(((rgb & 0xff0000) >> 16) / BIT_SPACING) * BIT_SPACING) << 16) + ((Math.round(((rgb & 0x00ff00) >> 8) / BIT_SPACING) * BIT_SPACING) << 8) + ((Math.round(((rgb & 0x0000ff)) / BIT_SPACING) * BIT_SPACING))
}

function getColorInt(byte) {
    return Math.round(byte / BIT_SPACING) * BIT_SPACING
}

let animationFrame = null
let image = new Image

function getAverageColor(imageData) {
    let r = 0
    let g = 0
    let b = 0
    const data = imageData.data
    for (let pixel = 0; pixel < data.length; pixel += 4) {
        r += data[pixel]
        g += data[pixel + 1]
        b += data[pixel + 2]
    }
    const divisor = data.length / 4
    return [r / divisor, g / divisor, b / divisor]
}

function floydSteinberg(sb, w, h) {
    // https://blog.ivank.net/floyd-steinberg-dithering-in-javascript.html
    for(var i=0; i<h; i++)
        for(var j=0; j<w; j++)
        {
           var ci = i*w+j;               // current buffer index
           var cc = sb[ci];              // current color
           var rc = getColorInt(cc)//(cc<128?0:255);      // real (rounded) color
           var err = cc-rc;              // error amount
           sb[ci] = rc;                  // saving real color
           if(j+1<w) sb[ci  +1] += (err*7)>>4;  // if right neighbour exists
           if(i+1==h) continue;   // if we are in the last line
           if(j  >0) sb[ci+w-1] += (err*3)>>4;  // bottom left neighbour
                     sb[ci+w  ] += (err*5)>>4;  // bottom neighbour
           if(j+1<w) sb[ci+w+1] += (err*1)>>4;  // bottom right neighbour
        }
    return sb
}

function floyd_steinberg(image) {
    var imageData = image.data;
    var imageDataLength = imageData.length;
    var w = image.width;
    var lumR = [],
        lumG = [],
        lumB = [];
  
    var newPixel, err;
  
    for (var i = 0; i < 256; i++) {
      lumR[i] = i * 0.299;
      lumG[i] = i * 0.587;
      lumB[i] = i * 0.110;
    }
  
    // Greyscale luminance (sets r pixels to luminance of rgb)
    for (var i = 0; i <= imageDataLength; i += 4) {
      //imageData[i] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);
      imageData[i] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);//Math.floor(lumR[imageData[i]]);
      imageData[i + 1] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);//Math.floor(lumG[imageData[i+1]]);
      imageData[i + 2] = Math.floor(lumR[imageData[i]] + lumG[imageData[i+1]] + lumB[imageData[i+2]]);//Math.floor(lumB[imageData[i+2]]);
    }
  
    for (var currentPixel = 0; currentPixel <= imageDataLength; currentPixel += 4) {
      // threshold for determining current pixel's conversion to a black or white pixel
      newPixel = getColorInt(imageData[currentPixel])//imageData[currentPixel] < 150 ? 0 : 255;
      err = Math.floor((imageData[currentPixel] - newPixel) / 23);
      imageData[currentPixel + 0 * 1 - 0 ] = newPixel;
      imageData[currentPixel + 4 * 1 - 0 ] += err * 7;
      imageData[currentPixel + 4 * w - 4 ] += err * 3;
      imageData[currentPixel + 4 * w - 0 ] += err * 5;
      imageData[currentPixel + 4 * w + 4 ] += err * 1;
      
      newPixel = getColorInt(imageData[currentPixel + 1])//imageData[currentPixel] < 150 ? 0 : 255;
      err = Math.floor((imageData[currentPixel + 1] - newPixel) / 23);
      imageData[currentPixel + 1 + 0 * 1 - 0 ] = newPixel;
      imageData[currentPixel + 1 + 4 * 1 - 0 ] += err * 7;
      imageData[currentPixel + 1 + 4 * w - 4 ] += err * 3;
      imageData[currentPixel + 1 + 4 * w - 0 ] += err * 5;
      imageData[currentPixel + 1 + 4 * w + 4 ] += err * 1;
      
      newPixel = getColorInt(imageData[currentPixel + 2])//imageData[currentPixel] < 150 ? 0 : 255;
      err = Math.floor((imageData[currentPixel + 2] - newPixel) / 23);
      imageData[currentPixel + 2 + 0 * 1 - 0 ] = newPixel;
      imageData[currentPixel + 2 + 4 * 1 - 0 ] += err * 7;
      imageData[currentPixel + 2 + 4 * w - 4 ] += err * 3;
      imageData[currentPixel + 2 + 4 * w - 0 ] += err * 5;
      imageData[currentPixel + 2 + 4 * w + 4 ] += err * 1;
      // Set g and b values equal to r (effectively greyscales the image fully)
      //imageData[currentPixel + 1] = imageData[currentPixel + 2] = imageData[currentPixel];
    }
  
    return image;
  }

function applyFilters() {
    const width = canvas.width
    const height = canvas.height
    let imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixel = col * 4 + row * width * 4
            //console.log(pixel)

            const r = data[pixel]
            const g = data[pixel + 1]
            const b = data[pixel + 2]
            const a = data[pixel + 3]

            const [ newR, newG, newB ] = getColor(r, g, b)
            data[pixel] = newR
            data[pixel + 1] = newG
            data[pixel + 2] = newB
        }
    }

    // Floyd-Steinberg dithering

    
    if (dithering.get()) {
        imageData = floyd_steinberg(imageData)
        /*let reds = []
        let greens = []
        let blues = []

        for (let pixel = 0; pixel < data.length; pixel += 4) {
            const r = data[pixel]
            const g = data[pixel + 1]
            const b = data[pixel + 2]
            reds.push(r)
            greens.push(g)
            blues.push(b)
            //colors.push((r << 16) + (g << 8) + (b))
        }
        
        floydSteinberg(reds, width, height)
        floydSteinberg(greens, width, height)
        floydSteinberg(blues, width, height)
        //colors = floydSteinberg(colors, width, height)

        for (let pixel = 0; pixel < reds.length; pixel++) {
            data[pixel * 4] = reds[pixel]//(colors[pixel] & 0xff0000) >> 16
            data[pixel * 4 + 1] = greens[pixel]//(colors[pixel] & 0x00ff00) >> 8
            data[pixel * 4 + 2] = blues[pixel]//(colors[pixel] & 0x0000ff)
        }*/
    }

    ctx.putImageData(imageData, 0, 0)
}

function draw() {
    const width = canvas.width
    const height = canvas.height

    ctx.reset()
    ctx.clearRect(0, 0, width, height) // clear the canvas
    
    ctx.drawImage(image, 0, 0, width, height)

    if (!image_preview.get())
        return

    applyFilters()
    /*if (gridEnabled.get() && gridLinesEnabled.get() && gridSize.get() > 0) { // Draw grid
        ctx.fillStyle = "#aaaaaa"
        let lineWidth = .25
        let counter = 0
        let grid = gridSize.get()
        while (counter < editor.width) { // for when the for loop is sus
            ctx.fillRect(counter - (lineWidth / 2), 0, lineWidth, editor.height)
            counter = counter + grid
        }
        counter = 0
        while (counter < editor.height) {
            ctx.fillRect(0, counter - (lineWidth / 2), editor.width, lineWidth)
            counter += grid
        }
    }*/
}

image_preview.changed(draw)
dithering.changed(draw)

image.onload = draw
file.changed(() => {
    const fileData = file.get()
    if (!fileData)
        return
    ctx.font = '12px serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2)
    image.src = URL.createObjectURL(fileData)
})

function compressString(prefix, string) {
    let data = `${prefix}:`
    const characters = string.replaceAll('\n', ';').split('')
    for (let i = 0; i < characters.length; i++) {
        let num = 1
        let letter = characters[i]
        while (i < characters.length - 1 && characters[i] === characters[i + 1]) {
            num++
            i++
        }
        if (num == 1)
            data += letter
        else
            data += `${letter}${num}`
    }
    return data
}

function applyTransparency(string) {
    const transparency1 = '\uE075\uE072\uE070'
    const transparency2 = '\uE076\uE073\uE071'
    const transparency4 = '\uE076\uE076\uE074\uE072'
    const transparency8 = '\uE078\uE075\uE073'
    const transparency178 = '\uE078'.repeat(25) + '\uE077\uE075\uE074\uE073\uE071'

    const replacements = [
        ['#', transparency1],
        ['##', transparency2],
        ['####', transparency4],
        ['########', transparency8],
        ['#'.repeat(178), transparency178]
    ]
    replacements.reverse().forEach(r => {
        string = string.replaceAll(r[0], r[1])
    })
    return string
}

function generate() {
    const notif = document.createElement('p')
    notif.innerText = 'Generating...'
    document.getElementById('action-properties').appendChild(notif)
    let generated = ""
    
    const width = canvas.width
    const height = canvas.height

    if (!image_preview.get())
        applyFilters()

    const data = ctx.getImageData(0, 0, width, height).data
    
    if (!image_preview.get())
        draw()

    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const pixel = col * 4 + row * width * 4
            //console.log(pixel)

            const r = data[pixel]
            const g = data[pixel + 1]
            const b = data[pixel + 2]
            const a = data[pixel + 3]
            if (a <= 0) {
                generated += '#'
            }
            else {
                generated += getChar(r, g, b, a)
            }
        }
        generated += '\n'
    }

    generated = applyTransparency(generated)
    generated = generated.substring(0, generated.length - 1) // chop of last \n

    if (compress.get()) {
        notif.innerText = 'Compressing...'
        generated = compressString(`${width}x${height}`, generated)
    }

    navigator.clipboard.writeText(generated)
    notif.innerText = `Copied! (${generated.length} characters)`
    notif.className = 'notif'
    setTimeout(() => { // animation length is 1s
        notif.remove()
    }, 2100)
}

document.getElementById('generate').onclick = generate

// panel sizes

const PANELS = Array.from([
    ['Standard', 512, 512, 512, 512], // name, surface size x, y, texture size x, y
    ['Wide', 1024, 512, 1024, 512],
    ['Panel', 512, 512, 512, 307.2],
])
const SIZES = {}
const CHARACTER_PIXELS = 1 / 2.88

const datalist = document.createElement('datalist')
datalist.id = 'panel-sizes'
Array.from(PANELS).forEach(element => {
    const name = element[0]
    const x = element[1]
    const y = element[2]
    const tx = element[3]
    const ty = element[4]

    const scale = 512 / Math.min(tx, ty)
    const screenSizeX = Math.round(x * CHARACTER_PIXELS * scale)
    const screenSizeY = Math.round(y * CHARACTER_PIXELS * scale)
    SIZES[name] = [screenSizeX, screenSizeY]

    const option = document.createElement('option')
    option.value = `${name} (${screenSizeX}x${screenSizeY})`
    datalist.appendChild(option)
});
document.body.appendChild(datalist)

function set_from_led_preset() {
    const presetName = lcd_preset.get().split(' (')[0]
    const preset = SIZES[presetName]
    if (!preset) {
        return
    }
    canvas.width = preset[0]
    canvas.height = preset[1]
    draw()
}

lcd_preset.changed(set_from_led_preset)

function custom_size() {
    const x = custom_size_x.get()
    const y = custom_size_y.get()
    const xNum = Number.parseInt(x)
    const yNum = Number.parseInt(y)
    if (xNum && yNum) {
        canvas.width = xNum
        canvas.height = yNum
    }
    else {
        set_from_led_preset()
    }
    draw()
}

custom_size_x.changed(custom_size)
custom_size_y.changed(custom_size)

/*function loop() {
    draw()
    animationFrame = window.requestAnimationFrame(loop)
}
animationFrame = window.requestAnimationFrame(loop)*/

function contextMenu(e) {
    e.preventDefault()
}

editor.addEventListener('contextmenu', contextMenu)