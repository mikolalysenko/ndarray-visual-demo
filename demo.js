"use strict"

var ndarray = require("ndarray")
var ops = require("ndarray-ops")
var lena = require("lena")
var pool = require("typedarray-pool")

var width = lena.shape[1]
var height = lena.shape[0]

var sliceCode = document.getElementById("arraySlice")

function getContext(id) {
  var canvas = document.getElementById(id)
  canvas.width = width
  canvas.height = height
  var context = canvas.getContext("2d")
  return context
}

var dataImage = getContext("dataImage")
var sliceImage = getContext("sliceImage")

function getTextNode(id) {
  var element = document.getElementById(id)
  var node = document.createTextNode("")
  element.appendChild(node)
  return node
}

var shapeElement  = getTextNode("arrayShape")
var strideElement = getTextNode("arrayStride")
var offsetElement = getTextNode("arrayOffset")

function plotView(context, array) {

  context.fillStyle = "#000"
  context.fillRect(0, 0, width, height)
  if(array.dimension < 2) {
    return
  }
  var pixels = context.getImageData(0, 0, width, height)
  var pixelArray = ndarray(pixels.data, [array.shape[0], array.shape[1], 3], [4*width, 4, 1], 0)
  if(array.dimension === 3) {
    ops.assign(
      pixelArray.hi(array.shape[0], array.shape[1], array.shape[2]), array)
  } else {
    ops.assign(pixelArray.pick(-1,-1,0), array)
    ops.assign(pixelArray.pick(-1,-1,1), array)
    ops.assign(pixelArray.pick(-1,-1,2), array)
  } 
  context.putImageData(pixels, 0, 0)
}

function repaint() {
  var sliceStr = sliceCode.value
  var slice
  try {
    var proc = new Function("array", "return " + sliceStr.replace(/\n/g, " "))
    slice = proc(lena)
  } catch(error) {
    return
  }
  if(typeof slice !== "object") {
    return
  }
  
  //Check bounds
  var lo = slice.offset
  var hi = slice.offset
  for(var i=0; i<slice.dimension; ++i) {
    var x = slice.stride[i] * (slice.shape[i]-1)
    if(x < 0) {
      lo += x
    }
    if(x > 0) {
      hi += x
    }
  }
  if((lo < 0) || (hi >= slice.data.length)) {
    return
  }

  //Update text elements
  shapeElement.textContent = "[" + slice.shape.join() + "]"
  strideElement.textContent = "[" + slice.stride.join() + "]"
  offsetElement.textContent = slice.offset

  //Generate image
  var outImage = ndarray(pool.mallocDouble(lena.data.length), lena.shape, lena.stride, lena.offset)
  ops.muls(outImage, lena, 0.3)
  var sliceData = ndarray(outImage.data, slice.shape, slice.stride, slice.offset)
  ops.assign(sliceData, slice)
  plotView(dataImage, outImage)
  pool.free(outImage.data)

  //Draw slice
  plotView(sliceImage, slice)
}

repaint()

sliceCode.addEventListener("change", repaint)
sliceCode.addEventListener("keyup", repaint)