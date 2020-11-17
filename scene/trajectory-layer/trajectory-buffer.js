/* eslint-disable no-empty */
// 批量动态轨迹缓存池，用于不断更新随机产生的四维（x,y,z,t）空间轨迹

/* Trajectory buffer layout:
  | attribute    | size     |
  | ------------ | -------- |
  | posFrom.x    | 1 float  |
  | posFrom.y    | 1 float  |
  | posFrom.z    | 1 float  |
  | posFrom.t    | 1 float  |
  | posTo.x      | 1 float  |
  | posTo.y      | 1 float  |
  | posTo.z      | 1 float  |
  | posTo.t      | 1 float  |
  | ------------ | -------- |
  | total        | 32 bytes |
 */

const bytesPerDatum = 32;
const floatsPerDatum=bytesPerDatum/4;

export const TIME_REFRENCE_POINT=Date.now();

export default class TrajectoryBuffer
{
    constructor(size,trackingTime)
    {

        this._DataBuffer=null;
        this._cursor=0;  // 当前缓冲区的游标
        this._trackingTime=trackingTime;  // 轨迹在缓冲池中显示的时间长度
        this._trackingMap=new Map();  // 轨迹点位置映射，便于根据id快速查找轨迹

        // 初始化缓冲池
        this.initialize(size);
    }

    // 将缓冲区清零，所有浮点数都设置为0.0
    clearBuffer()
    {
        const bufferData=new Float32Array(this._DataBuffer);
        bufferData.fill(0.,0,this._BufferSize*bytesPerDatum/4);
    }

    initialize(buffersize)
    {
        if(buffersize>this._BufferSize)
        {
            // 现有缓冲区小于需要构建的缓冲区，重新构建缓存
            this._DataBuffer=null;
        }

        this._DataBuffer=new ArrayBuffer(buffersize*bytesPerDatum); // 构建数据缓冲池
        this._BufferSize=buffersize;
        this.clearBuffer();
    
    }


    get bytesPerDatum() {
        return bytesPerDatum;
    }

    get buffersize() {
        return this._BufferSize;
    }

    get trackingTime() {
        return this._trackingTime;
    }

    get cursor() {
        return this._cursor;
    }

    // 获得当前游标处轨迹片段
    getCurrentTrack()
    {
        return this.getTrack(this._cursor);
    }

    getTrack(cursorPos){

        if(!this._DataBuffer && cursorPos>=this._BufferSize)
        {
            return null;
        } 

        const bufferData=new Float32Array(this._DataBuffer);
        const index=cursorPos*floatsPerDatum;

        if(bufferData[index+3]===0.0)
        {
            return null;
        }

        const trackBuffer=Object.assign({},
            {posFrom:[bufferData[index],
                      bufferData[index+1],
                      bufferData[index+2],
                      bufferData[index+3]],
              posTo:[bufferData[index+4],
                      bufferData[index+5],
                      bufferData[index+6],
                      bufferData[index+7]],
                    });

        // console.log(trackBuffer);

        return trackBuffer;
        
    }

    get buffer() {
        return this._DataBuffer;
    }

    // @tracks ： TrackInfo数组，用户接收推送轨迹点
    // | attribute    | size     |
    // | ------------ | -------- |
    // | id           | string   | 
    // | pos.x        | 1 float  |
    // | pos.y        | 1 float  |
    // | pos.z        | 1 float  |
    // | pos.t        | 1 float  |
    // | ------------ | -------- |
    
    push(tracks)
    {


        if(!this._DataBuffer)
        {
            return 0;
        }
        const bufferData=new Float32Array(this._DataBuffer);

        // 将推送进来的轨迹点串复制到缓存池中
        // eslint-disable-next-line max-statements
        tracks.forEach(trackinfo => {
            const {id,Point4D}=trackinfo;

            if(this._trackingMap.has(id))
            {
                // 在缓存中找到id相同最新轨迹点
                const index=this._trackingMap.get(id);
                if(index % floatsPerDatum === 0)
                {
                      // 找到了posFrom的索引，这次将posTo加到后面
                      bufferData[index+4]=Point4D[0];
                      bufferData[index+5]=Point4D[1];
                      bufferData[index+6]=Point4D[2];
                      bufferData[index+7]=Point4D[3]-TIME_REFRENCE_POINT;
                    //   console.log(`b:%d`,bufferData[index+7]);
  
                      // posTo的起始位置（float）
                      this._trackingMap.set(id,index+4);       
                    //   console.log('posTo:id=%d, index=%d, cursor=%d',id,index,this._cursor);
                    //   console.log('bufferdata:(%f,%f,%f,%f),(%f,%f,%f,%f)',
                    //                 bufferData[index],bufferData[index+1],bufferData[index+2],bufferData[index+3],
                    //                 bufferData[index+4],bufferData[index+5],bufferData[index+6],bufferData[index+7]);

                    
                }else
                {

                    
                    // 获取缓存区按浮点计数写入点
                    const target=this._cursor*floatsPerDatum;

                    // 把上一个段的posTo当做当前段的posFrom
                    bufferData.copyWithin(target,index,index+4)
                    bufferData[target+4]=Point4D[0];
                    bufferData[target+5]=Point4D[1];
                    bufferData[target+6]=Point4D[2];
                    bufferData[target+7]=Point4D[3]-TIME_REFRENCE_POINT;
                    // console.log(`b:%d`,bufferData[index+7]);

                    // posTo的起始位置（float）
                    this._trackingMap.set(id,target+4);
                    // console.log('posNew,id=%d, index=%d, cursor=%d',id,index,this._cursor);
                    // console.log('bufferdata:(%f,%f,%f,%f),(%f,%f,%f,%f)',
                    //             bufferData[target],bufferData[target+1],bufferData[target+2],bufferData[target+3],
                    //             bufferData[target+4],bufferData[target+5],bufferData[target+6],bufferData[target+7]);

                     // 找到了上一段posTo，需要重新构造新的轨迹段
                     this._cursor++;
  
                     if(this._cursor===this._BufferSize)
                     {
                         this._cursor=0; // 一旦缓冲池塞满了，就要从头开始
                                         // 由于缓冲池是按照时间排序的循环队列，
                                         // 如果缓冲池足够大，足以容纳规定的轨
                                         // 迹显示（生命）周期内所有被激活的轨迹
                                         // 就不用开辟新的缓存，否则会出现部分轨
                                         // 迹尾部显示不全的情况
                     }
                }

            }else
            {
                // 当前轨迹尚未注册，生成一个新的轨迹段
                // 写入posFrom
               
                const index=this._cursor*floatsPerDatum;
                // 写入一条全新的轨迹的第一个点
                bufferData[index]=Point4D[0];
                bufferData[index+1]=Point4D[1];
                bufferData[index+2]=Point4D[2];
                bufferData[index+3]=Point4D[3]-TIME_REFRENCE_POINT;
                // console.log(`b:%d`,bufferData[index+3]);

                // posFrom的起始位置（float）
                this._trackingMap.set(id,index);

                // console.log('posForm,id=%d,index=%d,cursor=%d',id,index,this._cursor);
                // console.log('bufferdata:(%f,%f,%f,%f)',
                //             bufferData[index],bufferData[index+1],bufferData[index+2],bufferData[index+3]);

                this._cursor++;
  
                if(this._cursor===this._BufferSize)
                {
                    this._cursor=0;  // 一旦缓冲池塞满了，就要从头开始
                                     // 由于缓冲池是按照时间排序的循环队列，
                                     // 如果缓冲池足够大，足以容纳规定的轨
                                     // 迹显示（生命）周期内所有被激活的轨迹
                                     // 就不用开辟新的缓存，否则会出现部分轨
                                     // 迹尾部显示不全的情况
                }


            }
          
        });

        return this._cursor;

    }

    finalize() {
        
        // 释放缓存区
        if (this._DataBuffer) {
            this._DataBuffer=null;
        }
    }
}