/*
;==============================================================
; BCxx.js, IO addresses #BC00-#BFFF                     KC 2017
;--------------------------------------------------------------
;
; Mouse emulation:
;    #BDE8 - X-pos mouse pointer (0-255)
;    #BDE9 - Y-pos mouse (0-255, 255 = top)
;    #BDEA -  mouse control
;
;        Write #BDEA:
;          - b7    = dis-/enable mouse pointer (0=disable)
;          - b5-6 = not used
;          - b0-4 = mouse pointer selector
;
;        Read #BDEA:
;          - b7    = dis-/enable mouse pointer (0=disable)
;          - b3-6 = not used
;          - b2    = right button (0=pressed)
;          - b1    = middle button (0=pressed)
;          - b0    = left button (0=pressed)
;
; RAMROM emulation:
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

// RAMROM variables

var     bRAMROM_enable = true,

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

// Mouse variables

var	nBDE8 = 0,	// X-pos mouse
	nBDE9 = 0,	// Y-pos mouse
	nBDEA = 0;	// Mouse control
	nBDEAw = 0x80;	// Mouse pointer

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

    case 0xbde8:
      return nBDE8;

    case 0xbde9:
      return nBDE9;

    case 0xbdea:
      return nBDEAw;

    case 0xbffe:
      return bRAMROM_enable ? aBFFE : a>>8;

    case 0xbfff:
      return bRAMROM_enable ? aBFFF : a>>8;

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

    case 0xbde8:
      nBDE8 = nVal;
      return;

    case 0xbde9:
      nBDE9 = nVal;
      return;

    case 0xbdea:
      return fMouseCtrl(nBDEAw = nVal);

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
        return;
      }

    case 0xbfff:
      if (bRAMROM_enable){
        aBFFF = nVal&7;
        return (aBFFF);
      } else {
        aBFFF = 0;
        return;
      }

    default:
//      tMessage ("Write " + nAddr.toString(16) + "," + nVal+ " PC:" + PCR.toString(16));

  }
}

function fMouseCtrl(val){fDebug("Mouse pointer: "+(val &0x0f));}
