/* eslint-disable no-empty */
// 信号缓存池，用于不断更新随机产生的空间信号

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


export default class SignalBuffer
{
    constructor(size,lifespan)
    {

        this._BufferSize=0; // 缓冲池存储对象数量，默认为1K
        this._DataBuffer=null;
        this._cursor=0;  // 当前缓冲区的游标
        this._lifespan=lifespan;  // 信号在缓冲池中存活的时间

        // 初始化缓冲池
        this.initialize(size);
    }

    clearBuffer(databuffer,buffersize)
    {
        const view = new DataView(databuffer);

        for (let i = 0; i < buffersize; i++) {
            const offset = i * bytesPerDatum;

            view.setFloat32(offset + 0, 0.0, true);    
            view.setFloat32(offset + 4, 0.0, true);
            view.setFloat32(offset + 8, 0.0, true);
            view.setFloat32(offset + 12, 0.0, true);
            view.setUint8(offset + 16, 0);
            view.setUint8(offset + 17, 0);
            view.setUint8(offset + 18, 0);
            view.setUint8(offset + 19, 0);
            view.setUint8(offset + 20, 0);
            view.setUint8(offset + 21, 0);
            view.setUint8(offset + 22, 0);
            view.setUint8(offset + 23, 0);
        }
    }

    initialize(buffersize)
    {
        if(!this._DataBuffer)
        {
            this._DataBuffer=new ArrayBuffer(buffersize*bytesPerDatum); // 构建数据缓冲池
            this._BufferSize=buffersize;
            this.clearBuffer(this._DataBuffer,buffersize);

        }else if(buffersize>this._BufferSize)
        {
            // 现有缓冲区小于需要构建的缓冲区，重新构建缓存
            this._DataBuffer=null;
            this._DataBuffer=new ArrayBuffer(buffersize*bytesPerDatum); // 构建数据缓冲池
            this._BufferSize=buffersize;
            this.clearBuffer(this._DataBuffer,buffersize);
        }
    }


    get bytesPerDatum() {
        return bytesPerDatum;
    }

    get buffersize() {
        return this._BufferSize;
    }

    get lifespan() {
        return this._lifespan;
    }

    get cursor() {
        return this._cursor;
    }

    getCurData(){
        if(!this._DataBuffer)
        {
            return null;
        } 

        let cursor;
        if(this._cursor===0) 
        {
            cursor=this.buffersize-1;
        }else
        {
            cursor=this.cursor-1;
        }

        const view = new DataView(this._DataBuffer);
        const offset = cursor * bytesPerDatum;

        const pos=Object.assign({},
            {position:[view.getFloat32(offset,true),
                       view.getFloat32(offset+4,true),
                       view.getFloat32(offset+8,true)]});

        // console.log(pos);

        return pos;
        
    }

    get buffer() {
        return this._DataBuffer;
    }

    push(signalProps)
    {
        if(!this._DataBuffer)
        {
            return 0;
        }

        const {position,triggerTime,OColor,DColor}=signalProps;

        const view = new DataView(this._DataBuffer);
        const offset = this._cursor * bytesPerDatum;

        view.setFloat32(offset , position[0] ,true);    
        view.setFloat32(offset + 4, position[1], true);
        view.setFloat32(offset + 8, position[2], true);  // 目前所有信号应该都是从地面发起，因此z=0，考虑到后面可能会有无人机等空中信号，对z值进行保留
        view.setFloat32(offset + 12, triggerTime, true);
        view.setUint8(offset + 16, OColor[0]);    // 颜色值原本打算所有信号统一的，但是考虑到不同类型的信号用不同颜色，比如共享单车开锁，关锁，车辆停靠、离开等，还是把颜色加进来，虽然浪费空间，但可以更加灵活地满足未知需求
        view.setUint8(offset + 17,  OColor[1]);
        view.setUint8(offset + 18,  OColor[2]);
        view.setUint8(offset + 19,  OColor[3]);
        view.setUint8(offset + 20, DColor[0]);
        view.setUint8(offset + 21, DColor[1]);
        view.setUint8(offset + 22, DColor[2]);
        view.setUint8(offset + 23, DColor[3]);

        this._cursor++;
  
        if(this._cursor===this._BufferSize)
        {
            this._cursor=0;  // 一旦缓冲池塞满了，就要从头开始
        }

        return this._cursor;

    }

    finalize() {
        if (this._DataBuffer) {
            this._DataBuffer=null;
        }
    }
}