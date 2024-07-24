class TimeUtils {
    static getDurationText = (duration: number) => {
      let sec = 0;
      let min = 0;
      let hour = 0;
  
      if (duration >= 3600) {
        hour = parseInt(duration / 3600 + '', 10);
        duration = duration % 3600;
      }
  
      if (duration >= 60) {
        min = parseInt(duration / 60 + '', 10);
        sec = duration % 60;
      } else {
        sec = duration;
      }
  
      let strSec = sec + '';
      let strMin = min + '';
      let strHour = hour + '';
  
      if (hour < 10) {
        strHour = '0' + strHour;
      }
      if (min < 10) {
        strMin = '0' + strMin;
      }
  
      if (sec < 10) {
        strSec = '0' + strSec;
      }
  
      return strHour + ':' + strMin + ':' + strSec;
    }
  }
  
  export {TimeUtils};