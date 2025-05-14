export enum BotBaseColors {
    Cyan = "00acc1",
    Blue = "1e88e5",
    DeepPurple = "5e35b1",
    Brown = "6d4c41",
    LightGreen = "7cb342",
    Purple = "8e24aa",
    LightBlue = "039be5",
    Green = "43a047",
    BlueGrey = "546e7a",
    Teal = "00897b",
    Indigo = "3949ab",
    Grey = "757575",
    Lime = "c0ca33",
    Pink = "d81b60",
    Red = "e53935",
    DeepOrange = "f4511e",
    Orange = "fb8c00",
    Yellow = "fdd835",
    Amber = "ffb300"
}

export enum BotEyes {
    Bulging = "bulging",
    Dizzy = "dizzy",
    Eva = "eva",
    Frame1 = "frame1",
    Frame2 = "frame2",
    Glow = "glow",
    Happy = "happy",
    Hearts = "hearts",
    Robocop = "robocop",
    Round = "round",
    RoundFrame1 = "roundFrame01",
    RoundFrame2 = "roundFrame02",
    Sensor = "sensor",
    Shade1 = "shade01"
}

export enum BotFaces {
    Round1 = "round01",
    Round2 = "round02",
    Square1 = "square01",
    Square2 = "square02",
    Square3 = "square03",
    Square4 = "square04",
}

export enum BotMouths {
    Bite = "bite",
    Diagram = "diagram",
    Grill1 = "grill01",
    Grill2 = "grill02",
    Grill3 = "grill03",
    Smile1 = "smile01",
    Smile2 = "smile02",
    Square1 = "square01",
    Square2 = "square02",
}

export enum BotSides {
    Antenna1 = "antenna01",
    Antenna2 = "antenna02",
    Cables1 = "cables01",
    Cables2 = "cables02",
    Round = "round",
    Square = "square",
    SquareAsymetric = "squareAssymetric",
}

export enum BotTextures {
    Camo1 = "camo01",
    Camo2 = "camo02",
    Circuits = "circuits",
    Dirty1 = "dirty01",
    Dirty2 = "dirty02",
    Dots = "dots",
    Grunge1 = "grunge01",
    Grunge2 = "grunge02",
}

export enum BotTops {
    Antenna = "antenna",
    AntennaCrooked = "antennaCrooked",
    Bulb1 = "bulb01",
    GlowingBulb1 = "glowingBulb01",
    GlowingBulb2 = "glowingBulb02",
    Horns = "horns",
    Lights = "lights",
    Pyramid = "pyramid",
    Radar = "radar",
}

export enum BackgroundColors {
    Black = "000000",
    White = "FFFFFF",
    Silver = "C0C0C0",
    Gray = "808080",
    Maroon = "800000",
    Red = "FF0000",
    Olive = "808000",
    Yellow = "FFFF00",
    Green = "008000",
    Lime = "00FF00",
    Teal = "008080",
    Aqua = "00FFFF",
    Navy = "000080",
    Blue = "0000FF",
    Purple = "800080",
    Fuchsia = "FF00FF",
    Orange = "FFA500",
    Gold = "FFD700",
    Coral = "FF7F50",
    Salmon = "FA8072"
}

export class Bot { }

function getRandomEnumValue<T extends object>(enumObj: T): T[keyof T] {
    let values = Object.values(enumObj)
    let randomIndex = Math.floor(Math.random() * values.length)
    return values[randomIndex]
}

export function generateRandomBot() {
    return {
        eyes: [getRandomEnumValue(BotEyes)],
        face: [getRandomEnumValue(BotFaces)],
        mouth: [getRandomEnumValue(BotMouths)],
        sides: [getRandomEnumValue(BotSides)],
        texture: [getRandomEnumValue(BotTextures)],
        top: [getRandomEnumValue(BotTops)],
        baseColor: [getRandomEnumValue(BotBaseColors)],
        backgroundColor: [getRandomEnumValue(BackgroundColors)],
    }
}

export class BotOptions {
    eyes: string[]
    face: string[]
    mouth: string[]
    sides: string[]
    texture: string[]
    top: string[]
    baseColor: string[]
    backgroundColor: string[]

    constructor(eyes: string[], face: string[], mouth: string[], sides: string[], texture: string[], top: string[], baseColor: string[], backgroundColor: string[]) {
        this.eyes = eyes
        this.face = face
        this.mouth = mouth
        this.sides = sides
        this.texture = texture
        this.top = top
        this.baseColor = baseColor
        this.backgroundColor = backgroundColor
    }
}