
let stop=false;
const cycletime=3000;
const lat=31.210022;
const lon=121.52995;
const r=0.032


onmessage = function(e) {
    // console.log('Worker: Message received from main script'); 

    switch (e.data) {
      case 'start':
        ListenSignal();
        break;
      case 'stop':
        stop=true;
        break;
      default:
       
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
  

async function ListenSignal()
{
    
    while(!stop)
    {
        const sigpos=[];
        const rand=5+Math.floor(6*Math.random());
        for(let i=0;i<rand;i++)
        {
           sigpos.push({position:[lon+r*Math.random(),lat+r*Math.random(),0.0]});
        }
        postMessage(sigpos);
        await sleep(cycletime*Math.random());
    }
}
