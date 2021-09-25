
let stopPark=false;
let stopTracking=false;
const cycletime=100;
const trackingTime=1000;
const lat=31.210022;
const lon=121.52995;
const r=0.032
const tracksNumber=20;


onmessage = function(e) {
    // console.log('Worker: Message received from main script'); 

    switch (e.data) {
      case 'startPark':
        stopPark=false;
        ListenSignal();
        break;
      case 'stopPark':
        stopPark=true;
        break;
      case 'stratTracking':
        stopTracking=false;
        ListenTracking();
        break;
      case 'stopTracking':
        stopTracking=true;
        break;
      default:
       
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
  

async function ListenSignal()
{
    
    while(!stopPark)
    {
        const sigpos=[];
        const rand=5+Math.floor(10*Math.random());
        for(let i=0;i<rand;i++)
        {
           sigpos.push([lon+r*Math.random(),lat+r*Math.random(),0.0]);
        }
        const msg={msgType:'signal',sigpos};
        postMessage(msg);
      
        await sleep(cycletime*Math.random());
    }
}

  // 接收轨迹并推送到缓冲区中
  // tracks=trackinfo[];
  // trackinfo={trackid,point4d};
  // point4d=float[4];
async function ListenTracking()
{
    // 按时间片读取轨迹点
    while(!stopTracking)
    {
        const trackingPoints=[];
        const rand=5+Math.floor(2*Math.random());
        for(let i=0;i<rand;i++)
        {
          trackingPoints.push({id:Math.round(tracksNumber*Math.random()),Point4D:[lon+r*Math.random(),lat+r*Math.random(),0.0,Date.now()]});
        }

        //  trackingPoints.push({id:1,Point4D:[lon+r*Math.random(),lat+r*Math.random(),0.0,Date.now()]});

        const msg={msgType:'trackingPoints',trackingPoints};
        postMessage(msg);
        
        await sleep(trackingTime*Math.random());
    }
}
