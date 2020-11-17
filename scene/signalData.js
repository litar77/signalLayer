
// const lon=121.52995;
// const lat=31.210022;
// const r=0.032
export const LINE_DATA=[
    {
        sourcePosition:[121.52995,31.210022,10.0],
        sourceTime:0.0,
        targetPosition:[121.5234,31.17565,10.0],
        targetTime:0.0,
    },
    {
        sourcePosition:[121.5234,31.17565,10.0],
        sourceTime:0.0,
        targetPosition:[121.530123,31.199872,10.0],
        targetTime:0.0,
    },
    {
        sourcePosition:[121.530123,31.199872,10.0],
        sourceTime:0.0,
        targetPosition:[121.501295,31.21342,10.0],
        targetTime:0.0,
    },
    {
        sourcePosition:[121.501295,31.21342,10.0],
        sourceTime:0.0,
        targetPosition:[121.5277895,31.20998022,10.0],
        targetTime:0.0,
    },
];

export const SIGNAL_DATA=[
    {
        Position:[121.52995,31.210022,10.0],
        TriggerTime:0.0,
        OColor:[80, 80, 200, 80],
        DColor: [100, 100, 255, 255]
    },
    {
        Position:[121.5234,31.17565,0],
        TriggerTime:0.0,
        OColor:[100, 30, 30, 10],
        DColor: [255, 0, 0, 255]
    },
    {
        Position:[121.530123,31.199872,0],
        TriggerTime:0.0,
        OColor:[100, 30, 30, 10],
        DColor: [255, 0, 0, 255]
    },
    {
        Position:[121.501295,31.21342,0],
        TriggerTime:0.0,
        OColor:[100, 30, 30, 10],
        DColor: [255, 0, 0, 255]
    },
    {
        Position:[121.5277895,31.20998022,0],
        TriggerTime:0.0,
        OColor:[100, 30, 30, 10],
        DColor: [255, 0, 0, 255]
    }

];

/* Singal buffer layout:
  | attribute    | size     |
  | ------------ | -------- |
  | positions.x  | 1 float  |
  | positions.y  | 1 float  |
  | positions.z  | 1 float  |
  | TriggerTime  | 1 float  |
  | OColor.R     | 1 byte   |
  | OColor.G     | 1 byte   |
  | OColor.B     | 1 byte   |
  | OColor.A     | 1 byte   |
  | DColor.R     | 1 byte   |
  | DColor.G     | 1 byte   |
  | DColor.B     | 1 byte   |
  | DColor.A     | 1 byte   |
  | ------------ | -------- |
  | total        | 24 bytes |
 */

const bytesPerDatum = 24;
const arraybuffer = new ArrayBuffer(SIGNAL_DATA.length * bytesPerDatum);
const view = new DataView(arraybuffer);

for (let i = 0; i < SIGNAL_DATA.length; i++) {
    const {Position,TriggerTime,OColor,DColor} = SIGNAL_DATA[i];
    const offset = i * bytesPerDatum;

    view.setFloat32(offset , Position[0] ,true);    
    view.setFloat32(offset + 4, Position[1], true);
    view.setFloat32(offset + 8, Position[2], true);  // 目前所有信号应该都是从地面发起，因此z=0，考虑到后面可能会有无人机等空中信号，对z值进行保留
    view.setFloat32(offset + 12, TriggerTime, true);
    view.setUint8(offset + 16, OColor[0]);    // 颜色值原本打算所有信号统一的，但是考虑到不同类型的信号用不同颜色，比如共享单车开锁，关锁，车辆停靠、离开等，还是把颜色加进来，虽然浪费空间，但可以更加灵活地满足未知需求
    view.setUint8(offset + 17,  OColor[1]);
    view.setUint8(offset + 18,  OColor[2]);
    view.setUint8(offset + 19,  OColor[3]);
    view.setUint8(offset + 20, DColor[0]);
    view.setUint8(offset + 21, DColor[1]);
    view.setUint8(offset + 22, DColor[2]);
    view.setUint8(offset + 23, DColor[3]);
}

export const databuffer=new Float32Array(arraybuffer);