// ! The most fun part ! //

const editor = document.getElementById("editor")
const ctx = editor.getContext("2d")

if (ctx == null) {
    console.log("Your browser must not support canvases!")
    alert("Your browser must not support canvases!")
    throw new Error("Your browser must not support canvases!")
}

// Math

// Math, especially geometry, is not my specialty!

const PI = Math.PI
const PI2 = Math.PI * 2

function toRad(degrees) {
    return degrees * (PI / 180)
}

// Settings

const xAxisColor = "#ff0000aa"
const yAxisColor = "#00ff00aa"
const handleSize = 10

const gridCheckbox = document.getElementById("OPTION_enableGrid")
const gridLinesCheckbox = document.getElementById("OPTION_enableGridLines")
const gridNumber = document.getElementById("OPTION_gridSize")

const borderCollisionsCheckbox = document.getElementById("OPTION_borderCollisions")

function getDebug() {
    return true
}

function getTopLeftRendering() {
    return true
}

function getGridEnabled() {
    return gridCheckbox.checked
}

function getGridLinesEnabled()  {
    return gridLinesCheckbox.checked
}

function getGrid() {
    if (!getGridEnabled()) return 0
    if (gridNumber.value.length <= 0) return 0
    const parsed = parseInt(gridNumber.value)
    if (isNaN(parsed)) {
        gridCheckbox.checked = false
        return 0
    }
    return parsed
}

function getBorderCollisionsEnabled() {
    return borderCollisionsCheckbox.checked
}

// Canvas Objects

var currentScreen = 'main'
let screens = {}
screens[currentScreen] = {elements: []}

function getParentsNumberProperty(parentIndex, property) {
    const elements = screens[currentScreen].elements
    let outProperty = 0
    while (true) {
        if (parentIndex == null) return outProperty
        const element = elements[parentIndex]
        const elementProperty = element[property]
        if (elementProperty != null) {
            outProperty += elementProperty
        }
        parentIndex = element.parent
    }
}

function makeBox(properties) {
    return {
        x: properties.x || 0,
        y: properties.y || 0,
        width: properties.width || 256,
        height: properties.height || 256,
        rotation: properties.rotation || 0,
        color: properties.color || "rgb(255, 255, 255)",
        parent: properties.parent,
        getX() {
            const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            return parent != null ? (parent.getX() + parent.width / 2 - this.width / 2) + this.x : this.x
        },
        getY() {
            const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            return parent != null ? (parent.getY() + parent.height / 2 - this.height / 2) + this.y : this.y
        },
        getRotation() {
            //const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            return this.parent != null ? getParentsNumberProperty(this.parent, "rotation") + this.rotation : this.rotation
        },
        draw(ctx) {
            //const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            const x = this.getX()
            const y = this.getY()
            const rotation = this.getRotation()

            const needsToRotate = (this.width != this.height || rotation % 90 != 0) // if it's a square we may not need to rotate!
            if (getDebug()) {
                ctx.fillStyle = "rgba(255, 255, 255, .5)"
                ctx.fillRect(x, y, this.width, this.height)
            }

            ctx.fillStyle = this.color
            if (needsToRotate) {
                ctx.translate(x + this.width / 2, y + this.height / 2) // move translation center to middle of shape
                ctx.rotate(-toRad(rotation)) // rotate er'!
                ctx.translate(-(x + this.width / 2), -(y + this.height / 2)) // move it back to draw it
            }

            ctx.fillRect(x, y, this.width, this.height) // draw de shape

            if (needsToRotate) {
                ctx.resetTransform()
            }
        },
        inBounds(x, y) {
            // TODO: rotation detection
            const myX = this.getX()
            const myY = this.getY()
            return  x > myX &&
                    x < myX + this.width &&
                    y > myY &&
                    y < myY + this.height
        }
    }
}

function makeCircle(properties) {
    return {
        x: properties.x || 0,
        y: properties.y || 0,
        width: properties.width || 256,
        height: properties.height || 256 / 2,
        rotation: properties.rotation || 0,
        color: properties.color || "rgb(255, 0, 0)",
        parent: properties.parent,
        getX() {
            const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            return parent != null ? (parent.getX() + parent.width / 2 - this.width / 2) + this.x : this.x
        },
        getY() {
            const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            return parent != null ? (parent.getY() + parent.height / 2 - this.height / 2) + this.y : this.y
        },
        getRotation() {
            //const parent = this.parent != null ? screens[currentScreen].elements[this.parent] : null
            return this.parent != null ? getParentsNumberProperty(this.parent, "rotation") + this.rotation : this.rotation
        },
        draw(ctx) {
            const x = this.getX()
            const y = this.getY()
            const rotation = this.getRotation()

            if (getDebug()) {
                ctx.fillStyle = "blue"
                ctx.fillRect(x, y, this.width, this.height)
            }

            ctx.fillStyle = this.color
            if (this.width == this.height) {
                ctx.beginPath()
                ctx.arc(x + this.width / 2, y + this.height / 2, this.width / 2, 0, PI2, true)
                ctx.closePath()
                ctx.fill()
            }
            else {
                ctx.beginPath()
                ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, -toRad(rotation), 0, PI2)
                ctx.closePath()
                ctx.fill()
            }
        },
        inBounds(x, y) {
            // TODO: rotation detection
            const myX = this.getX()
            const myY = this.getY()
            return  x > myX &&
                    x < myX + this.width &&
                    y > myY &&
                    y < myY + this.height
        }
    }
}

// Canvas Drawing

let animationFrame

function getElement(index) {
    return screens[currentScreen].elements[index]
}

function addElement(element) {
    screens[currentScreen].elements.push(element)
}

function drawElementList() {
    
}

function drawResizeGrips() {
    if (selectedIndex < 0) return
    const element = getElement(selectedIndex)
    if (element == null) return
    //const halfHandleSize = handleSize / 2
    //ctx.fillStyle = xAxisColor
    //var x = element.getX()
    //var y = element.getY()

    leftHandle.x = -element.width / 2
    leftHandle.parent = selectedIndex
    rightHandle.x = element.width / 2
    rightHandle.parent = selectedIndex

    topHandle.y = -element.height / 2
    topHandle.parent = selectedIndex
    bottomHandle.y = element.height / 2
    bottomHandle.parent = selectedIndex

    leftHandle.draw(ctx)
    rightHandle.draw(ctx)
    topHandle.draw(ctx)
    bottomHandle.draw(ctx)
    //ctx.fillRect(x - halfHandleSize, y + element.height / 2 - halfHandleSize, handleSize, handleSize)
    //ctx.fillRect(x + element.width - halfHandleSize, y + element.height / 2 - halfHandleSize, handleSize, handleSize)
    //ctx.fillStyle = yAxisColor
    //ctx.fillRect(x + element.width / 2 - halfHandleSize, y - halfHandleSize, handleSize, handleSize)
    //ctx.fillRect(x + element.width / 2 - halfHandleSize, y + element.height - halfHandleSize, handleSize, handleSize)
}

function drawGridlines() {
    ctx.fillStyle = "#aaaaaa"
    let lineWidth = .25
    let counter = 0
    let grid = getGrid()
    while (counter < editor.width) {
        ctx.fillRect(counter - (lineWidth / 2), 0, lineWidth, editor.height)
        counter = counter + grid
    }
    counter = 0
    while (counter < editor.height) {
        ctx.fillRect(0, counter - (lineWidth / 2), editor.width, lineWidth)
        counter += grid
    }
}

function draw() {
    const screen = screens[currentScreen]
    ctx.clearRect(0, 0, editor.width, editor.height)
    for (let i = 0; i < screen.elements.length; i++) { // draw elements
        const element = screen.elements[i]
        element.draw(ctx)
    }
    if (mouseDown && selectedIndex >= 0) { // draw "cursor" if moving something
        ctx.fillStyle = "red"
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 3, 0, PI2, true)
        ctx.closePath()
        ctx.fill()
    }
    const gridEnabled = getGridEnabled() // draw grid
    gridNumber.parentElement.style.display = gridEnabled ? "list-item" : "none"
    if (getGridLinesEnabled() && gridEnabled && getGrid() > 0) { // draw grid
        drawGridlines()
    }
    drawResizeGrips() // draw grips

    // request another animation frame
    animationFrame = window.requestAnimationFrame(draw)
}

const leftHandle = makeBox({x: 0, y: 0, width: handleSize, height: handleSize, color: xAxisColor})
const rightHandle = makeBox({x: 0, y: 0, width: handleSize, height: handleSize, color: xAxisColor})
const topHandle = makeBox({x: 0, y: 0, width: handleSize, height: handleSize, color: yAxisColor})
const bottomHandle = makeBox({x: 0, y: 0, width: handleSize, height: handleSize, color: yAxisColor})

addElement(makeBox({x:0,y:0,width:0.000001,height:0.00001}))
addElement(makeCircle({x: 5, y: 5, width: 60, height: 70, color: "#ffffff"})) // test elements
addElement(makeCircle({x: 0, y: 0, width: 50, height: 60, parent: 1}))
addElement(makeBox({x: 250 - 42, y: 250 - 42, width: 32, height: 32, color: "#00ff00"}))
//addElement(makeBox({x: 0, y: 0, width: 10, height: 10, color: "#ff0000", parent: 3}))
animationFrame = window.requestAnimationFrame(draw) // start the drawing ! ! ! !

// Canvas Input

let selectedIndex = -1
let handleMode = 'move'

var mouseDown = false
var mouseX, mouseY
var mouseStartX, mouseStartY
var startX, startY
var startSizeX, startSizeY

function setMouseXY(e) {
    const rect = editor.getBoundingClientRect()
    mouseX = (e.clientX - rect.left) / rect.width * editor.width
    mouseY = (e.clientY - rect.top) / rect.height * editor.height
}

function canvasMouseDown(e) {
    mouseDown = true
    setMouseXY(e)
    mouseStartX = mouseX
    mouseStartY = mouseY
    if (selectedIndex >= 0) { // check resize handles
        const element = getElement(selectedIndex)
        if (element == null) return
        const halfHandleSize = handleSize / 2
        var x = element.getX()
        var y = element.getY()

        startX = element.x
        startY = element.y
        startSizeX = element.width
        startSizeY = element.height
        if (leftHandle.inBounds(mouseX, mouseY)) { // left handle x-
            handleMode = 'resizeX-'
            return
        }
        else if (rightHandle.inBounds(mouseX, mouseY)) { // right handle x+
            handleMode = 'resizeX+'
            return
        }
        else if (topHandle.inBounds(mouseX, mouseY)) { // top handle y-
            handleMode = 'resizeY-'
            return
        }
        else if (bottomHandle.inBounds(mouseX, mouseY)) { // bottom handle y+
            handleMode = 'resizeY+'
            return
        }
        //else if (mouseX > )
    }

    selectedIndex = -1
    const screen = screens[currentScreen]
    for (let i = screen.elements.length - 1; i > -1; i--) {
        const element = screen.elements[i]
        if (element.inBounds(mouseX, mouseY)) {
            selectedIndex = i
            startX = element.x//element.getX ? element.getX() : element.x
            startY = element.y//element.getY ? element.getY() : element.y
            //console.log('Selected element ' + i)
            handleMode = 'move'
            break
        }
    }
}

function canvasMouseUp(e) {
    mouseDown = false
    //selectedIndex = -1
}

function canvasMouseMove(e) {
    if (!mouseDown) return
    setMouseXY(e)
    if (selectedIndex >= 0) {
        const screen = screens[currentScreen]
        const element = screen.elements[selectedIndex]
        var deltaX = mouseX - mouseStartX
        var deltaY = mouseY - mouseStartY
        const grid = getGrid()

        if (handleMode == 'move') {
            if (grid > 0) { // if grid enabled, snap to it!
                element.x = Math.round((startX + deltaX) / grid) * grid
                element.y = Math.round((startY + deltaY) / grid) * grid
            }
            else { // otherwise just do simple delta stuffs
                element.x = startX + deltaX
                element.y = startY + deltaY
            }
            if (getBorderCollisionsEnabled() && element.parent == null) { // do border collisions with base x,y,width,and height (not amazing but it works for the most part)
                // ignores parents because i dont wanna do that sh*t
                element.x = element.x >= 0 ? (element.x > editor.width - element.width ? editor.width - element.width : element.x) : 0
                element.y = element.y >= 0 ? (element.y > editor.height - element.height ? editor.height - element.height : element.y) : 0
            }
        }
        else if (handleMode.includes("resize")) {
            if (handleMode.includes("X-")) {
                /*if (deltaX > 0) {
                    element.x = startX
                    element.width = startSizeX
                    return
                }*/
                element.x = startX + deltaX
                element.width = startSizeX - deltaX
            }
            if (handleMode.includes("X+")) {
                /*if (deltaX < 0) {
                    element.x = startX
                    element.width = startSizeX
                    return
                }*/
                element.x = startX
                element.width = startSizeX + deltaX
            }
            if (handleMode.includes("Y-")) {
                /*if (deltaY > 0) {
                    element.y = startY
                    element.height = startSizeY
                    return
                }*/
                element.y = startY + deltaY
                element.height = startSizeY - deltaY
            }
            if (handleMode.includes("Y+")) {
                /*if (deltaY < 0) {
                    element.y = startY
                    element.height = startSizeY
                    return
                }*/
                element.y = startY
                element.height = startSizeY + deltaY
            }

            if (element.width < 0) element.width = 0.02
            if (element.height < 0) element.height = 0.02
            if (grid > 0) { // if grid enabled, snap to it!
                element.x = Math.round(element.x / grid) * grid
                element.y = Math.round(element.y / grid) * grid
                element.width = Math.round(element.width / grid) * grid
                element.height = Math.round(element.height / grid) * grid
            }
        }
    }
}

editor.addEventListener('mousedown', canvasMouseDown)
editor.addEventListener('mouseup', canvasMouseUp)
editor.addEventListener('mouseleave', canvasMouseUp)
editor.addEventListener('mousemove', canvasMouseMove)

// Input

let keysDown = []

function keyDown(e) {
    e = e || window.event
    keysDown[e.key] = true
}

function keyUp(e) {
    e = e || window.event
    keysDown[e.key] = false
}

function contextMenu(e) {
    e.preventDefault()
}

document.addEventListener('keydown', keyDown)
document.addEventListener('keyup', keyUp)
editor.addEventListener('contextmenu', contextMenu)