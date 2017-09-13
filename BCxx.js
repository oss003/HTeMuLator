/*
;==============================================================
; BCxx.js, IO addresses #BC00-#BFFF                     KC 2017
;--------------------------------------------------------------
;
; RAMROM emulation at #BFFE/F
;    #BFFE - Status register RAMROM board
;    #BFFF - Switch byte util roms at #Axxx
;
;==============================================================
*/

/*
;==============================================================
; DEFINITION OF VARIABLES
;==============================================================
;
*/

var
// Dis-/enable hardware emulation for devices
        bRAMROM_enable = true;

        aBFFE= bBBC ? 3 : 0,
        aBFFF=0,

        aAxxxROM = [],
        aUtilRoms = [];

        aUtilRoms[0] = sAXR1_ROM;
        aUtilRoms[1] = sPCHARM_ROM;
        aUtilRoms[2] = sAWROM_ROM;
        aUtilRoms[3] = sGAGS_ROM;
        aUtilRoms[4] = sPP_TOOLKIT_ROM;
        aUtilRoms[5] = sWATFORD_ROM;
        aUtilRoms[6] = sFPGA_UTILS_ROM;
        aUtilRoms[7] = sSDROM_ROM;

/*
;--------------------------------------------------------------
;
; fBCxxRead(nAddr)
;
; Read address nAddr in range #BC00-#BFFF
;
;--------------------------------------------------------------
*/

function fBCxxRead(nAddr){
  switch (a = nAddr){

    case 0xbffe:
      return bRAMROM_enable ? aBFFE : a>>8;

    case 0xbfff:
      return bRAMROM_enable ? aBFFF : a>>8;

    default:
      return a>>8;
//     tMessage ("Read " + nAddr.toString(16) + " PC:" + PCR.toString(16));

  }
}

/*
;--------------------------------------------------------------
;
; fBCxxWrite(nAddr,nVal)
;
; Write value nVal at address nAddr in range #BC00-#BFFF
;
;--------------------------------------------------------------
*/

function fBCxxWrite(nAddr,nVal){
  switch (a = nAddr){

    case 0xbffe:
      if (bRAMROM_enable){
        aBFFE=nVal;
        if (nVal & 8){
          bBBC = true;
          fInitAddr();
          clearMemory();
          break;
        } else if (bBBC == true){
          bBBC = false;
          fInitAddr();
          clearMemory();
          break;
        }
        return aBFFE;
      } else {
        aBFFE=0;
        return 0;
      }

    case 0xbfff:
      if (bRAMROM_enable){
        aBFFF = nVal&7;
        return (aBFFF);
      } else {
        aBFFF = 0;
        return 0;
      }

    default:
//      tMessage ("Write " + nAddr.toString(16) + "," + nVal+ " PC:" + PCR.toString(16));

  }
}

