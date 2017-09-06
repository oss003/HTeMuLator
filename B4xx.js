/*
;
;==============================================================
; B400_MMC.js, AtoMMC emulation at #B400/1/2/3          KC 2017
;--------------------------------------------------------------
;
; Changed functions in HTeMuLator.html:
;
; fIOR(a),		expanded with fMMCRead(a)
; fIOW(a,v),	expanded with fMMCWrite(a,v)
; STBA(a,v),	expanded to 32kB RAM and 8kB video RAM
; LDBA(a),		expanded to 32kB RAM and 8kB video RAM
;				changed AXR1_ROM with SDROM_ROM
; VARG_type(),	added prog and disk property
; fLogin(),		added loading B400MMC.js
;				added loading Disk001.js
;				added fDebug textarea
;
;==============================================================
;
;==============================================================
; DEFINITION OF VARIABLES
;==============================================================
;
*/

var
// PIC registers
	CMD_REG			= 0x00,
	LATCH_REG 		= 0x01,
	READ_DATA_REG		= 0x02,
	WRITE_DATA_REG		= 0x03,

// DIR_CMD_REG commands
	CMD_DIR_OPEN		= 0x00,
	CMD_DIR_READ		= 0x01,
	CMD_DIR_CWD		= 0x02,

// CMD_REG_COMMANDS
	CMD_FILE_OPEN_IMG	= 0x12,
	CMD_INIT_READ		= 0x20,
	CMD_INIT_WRITE		= 0x21,

// SDOS_LBA_REG commands
	CMD_LOAD_PARAM		= 0x40,
	CMD_GET_IMG_STATUS	= 0x41,
	CMD_GET_IMG_NAME	= 0x42,
	CMD_READ_IMG_SEC	= 0x43,
	CMD_WRITE_IMG_SEC	= 0x44,
	CMD_SER_IMG_INFO	= 0x45,
	CMD_VALID_IMG_NAMES	= 0x46,
	CMD_IMG_UNMOUNT		= 0x47,

// UTIL_CMD_REG commands
	CMD_GET_CARD_TYPE	= 0x80,
	CMD_SET_PORT_DDR	= 0xA1,
	CMD_READ_PORT		= 0xA2,
	CMD_GET_FW_VER		= 0xE0,
	CMD_GET_BL_VER		= 0xE1,
	CMD_GET_CFG_BYTE	= 0xF0,
	CMD_SET_CFG_BYTE	= 0xF1,
	CMD_GET_HEARTBEAT	= 0xFE,

// Status codes
	STATUS_OK		= 0x3F,
	STATUS_COMPLETE		= 0x40,
	STATUS_EOF		= 0x60,
	STATUS_BUSY		= 0x80,
	ERROR_MASK		= 0x3F,

// To be or'd with STATUS_COMPLETE
	ERROR_NO_DATA		= 0x08,
	ERROR_INVALID_DRIVE	= 0x09,
	ERROR_READ_ONLY		= 0x0A,
	ERROR_ALREADY_MOUNT	= 0x0A,
	ERROR_TOO_MANY_OPEN	= 0x12,

// Global vars

	dFilename = "",			// Filename loaded diskfile
	dDisk,				// Array with diskimage loaded diskfile
	filenum,			// Filenumber for RAF
	debug = ARGV.debug * 1,		// Output to debug window on/off

// AtoMMC vars
	LATD = 255,			// Data latch
	globalData = [],		// Data array
	globalIndex = 0,		// Data array pointer
	byteValueLatch,			// Latch bytevalue
	globalLBAOffset = 0,		// Disk image array pointer
        heartbeat = 0x55,
	autoboot = ARGV.autoboot * 1,
	configByte = (autoboot == 0) ? 0xff : 0,		// Configuration byte AtoMMC

// Drive vars
	aDisks=[],			// Array with disk images
	lastDriveNo = -1,
	globalCurDrive = 0,		// Current selected Drive
	sFilter = "",			// Filterstring
	DirPointer = 0;			// Directory counter

function Struct(val1,name, val2)	// Structure for driveinfo table
{
	this.basesector = val1;
	this.filename = name;
	this.attribs = val2;
	this.image = [];
}

	driveInfo = [];			// Drive info table
	driveInfo[0] = new Struct(0,"",255);
	driveInfo[1] = new Struct(0,"",255);
	driveInfo[2] = new Struct(0,"",255);
	driveInfo[3] = new Struct(0,"",255);


/*
;==============================================================
; DEFINITIONS OF ATOMMC FIRMWARE FUNCTIONS
;==============================================================

;--------------------------------------------------------------
;
; fMMCRead(nAddr)
;
; Read AtoMMC register nAddr
;  #B400 - CMD_REG
;  #B402 - READ_DATA_REG
;
;--------------------------------------------------------------
*/

function fMMCRead(nAddr)
{
    var Ret = 0,test;

    switch (A=nAddr&7){

        case CMD_REG:
          Ret = LATD;
          break;

        case LATCH_REG:
          // latch the written value
          WriteDataPort(byteValueLatch);
          break;
 
        case READ_DATA_REG:
            // read data port.
            //
            // any data read requests must be primed by writing CMD_INIT_READ (0x3f) here
            // before the 1st read.
            //
            // this has to be done this way as the PIC hardware only latches the address
            // on a WRITE.
            WriteDataPort(globalData[globalIndex]);
            ++globalIndex;
            Ret = LATD;
            break;

        default:
            WriteDataPort(STATUS_OK);

    }

    tDebug("r" + fHexWord(nAddr) + "<-" + ((typeof Ret=="undefined") ? "-" : HEX(Ret))+":"+
           "a" + HEX(ACC) + "x" + HEX(XIR) + "y" + HEX(YIR) + "pc" + fHexWord(PCR));
    return (typeof Ret=="string") ? Ret.charCodeAt(0) : Ret;
}

/*
;--------------------------------------------------------------
;
; fMMCWrite(nAddr,nVal)
;
; Write value nVal to AtoMMC register nAddr
;  #B400 - CMD_REG
;  #B401 - WRITE_DATA_REG
;  #B402 - READ_DATA_REG
;  #B403 - LATCH_REG
;
;--------------------------------------------------------------
*/

function fMMCWrite(nAddr,nVal)
{
    var Ret = 0;
    switch (A=nAddr&7){
        case CMD_REG:{
            received = nVal;
	    // File Group 0x10-0x17, 0x30-0x37, 0x50-0x57, 0x70-0x77
	    // filenum = bits 6,5
	    // mask1 = 10011000 (test for file group command)
	    // mask2 = 10011111 (remove file number)
	    if ((received & 0x98) == 0x10) {
	      filenum = (received >> 5) & 3;
	      received &= 0x9F;
	    }

	    // Data Group 0x20-0x23, 0x24-0x27, 0x28-0x2B, 0x2C-0x2F
	    // filenum = bits 3,2
	    // mask1 = 11110000 (test for data group command)
	    // mask2 = 11110011 (remove file number)
	    if ((received & 0xf0) == 0x20) {
	      filenum = (received >> 2) & 3;
	      received &= 0xF3;
	    }
            WriteDataPort(STATUS_BUSY);

            switch (received){

            // Directory group, moved here 2011-05-29 PHS.

                case CMD_DIR_OPEN:
                    // reset the directory reader
                    //
                    // when 0x3f is read back from this register it is appropriate to
                    // start sending cmd 1s to get items.
                    //
                    var StopFlag;

                    sFilter="";
                    for (i = 0; i < globalData.length -1; ++i){
                      sFilter = sFilter + String.fromCharCode(globalData[i]);
                    }
                    DirPointer = 0;
                    globalData = [];
                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_DIR_READ:
                    var FileName = [];

                    if (aDisks.length !== 0){
                       if (DirPointer !== aDisks.length){
                         // get next directory entry
                         //
                         while (matchRuleShort(aDisks[DirPointer][0].n, sFilter) == false && DirPointer !== aDisks.length-1){
                           ++DirPointer;
                         }
                         if (matchRuleShort(aDisks[DirPointer][0].n, sFilter) == true && DirPointer !== aDisks.length){
                           for (i = 0; i < aDisks[DirPointer][0].n.length; ++i){
                             globalData[i+1]=aDisks[DirPointer][0].n[i];
                           }
                           globalData[i+1]=0;
                           if (DirPointer < aDisks.length){++DirPointer};
                           WriteDataPort(STATUS_OK);
                         } else {
                           WriteDataPort(STATUS_COMPLETE);
                         }
                         break;
                       } else {
                         // done
                         //
                         WriteDataPort(STATUS_COMPLETE);
                         break;
                       }
                    }

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                case CMD_DIR_CWD:
                    // set CWD
                    //
                    worker = WFN_SetCWDirectory;

           // File group.

                case CMD_FILE_CLOSE:
                    // close the open file, flushing any unwritten data
                    //
                    worker = WFN_FileClose;

                case CMD_FILE_OPEN_READ:
                    // open the file with name in global data buffer
                    //
                   worker = WFN_FileOpenRead;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

                case CMD_FILE_OPEN_IMG:
                    // open the file as backing image for virtual floppy drive
                    // drive number in globaldata[0] followed by asciiz name.
                    var    i = globalData[0],
                        m = 1,
                        n = 0,
                        Ret=0x44,
                        newDiskName = "";

                    while(globalData[m] && m < 12){
                        newDiskName = newDiskName + String.fromCharCode(globalData[m]) ;
                        ++m;
                        ++n;
                    }

                    for (i = 0; i < aDisks.length; ++i){
                      if (aDisks[i][0].n == newDiskName){
                        driveInfo[globalData[0]].filename = newDiskName;
                        driveInfo[globalData[0]].attribs=0;
                        driveInfo[globalData[0]].image=aDisks[i][0].d;
                        Ret=STATUS_OK;
                        break;
                      }
                    }
                    WriteDataPort(Ret);
                    break;


/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                case CMD_FILE_OPEN_WRITE:
                    // open the file with name in global data buffer for write
                    //
                    worker = WFN_FileOpenWrite;

                case CMD_FILE_OPEN_RAF:
                    // open the file with name in global data buffer for write/append
                    //
                    worker = WFN_FileOpenRAF;

                case CMD_FILE_DELETE:
                    // delete the file with name in global data buffer
                    //
                    worker = WFN_FileDelete;

                case CMD_FILE_GETINFO:
                    // return file's status byte
                    //
                    worker = WFN_FileGetInfo;

                case CMD_FILE_SEEK:
                    // seek to a location within the file
                    //
                    worker = WFN_FileSeek;
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

                case CMD_INIT_READ:
                    // All data read requests must send CMD_INIT_READ before begining reading
                    // data from READ_DATA_PORT. After execution of this command the first byte
                    // of data may be read from the READ_DATA_PORT.
                    WriteDataPort(globalData[0]);
                    globalIndex = 1;
                    break;

                case CMD_INIT_WRITE:
                    // all data write requests must send CMD_INIT_WRITE here before poking data at
                    // WRITE_DATA_REG
                    // globalDataPresent is a flag to indicate whether data is present in the bfr.
                    globalIndex = 0;
                    globalData = [];
                    break;

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                case CMD_READ_BYTES:
                    // Replaces READ_BYTES_REG
                    // Must be previously written to latch reg.
                    globalAmount = byteValueLatch;
                    worker = WFN_FileRead;

                case CMD_WRITE_BYTES:
                    // replaces WRITE_BYTES_REG
                    // Must be previously written to latch reg.
                    globalAmount = byteValueLatch;
                    worker = WFN_FileWrite;

                case CMD_EXEC_PACKET:
                    // Exec a packet in the data buffer.
                    worker = WFN_ExecuteArbitrary;

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

         // SDDOS/LBA operations

                case CMD_LOAD_PARAM:
                    // load sddos parameters for read/write
                    // globalData[0] = img num
                    // globalData[1..4 incl] = 256 byte sector number
                    globalCurDrive = globalData[0] & 3;
                    globalLBAOffset = 256*globalData[1] + 65536*globalData[2];
                    break;

                case CMD_GET_IMG_STATUS:
                    // retrieve sddos image status
                    // globalData[0] = img num
                    globalCurDrive=globalData[0];
                    WriteDataPort(driveInfo[byteValueLatch & 3].attribs);
                    break;

                case CMD_GET_IMG_NAME:
                    // retrieve sddos image names
                    var i, m, n = 0;
                    for (i = 0; i < 4; ++i){
                        if (driveInfo[i].attribs != 0xff) {
                            m = 0;
                            while(driveInfo[i].filename[m] && m < 12){
                                globalData[n] = driveInfo[i].filename[m];
                                ++m;
                                ++n;
                            }
                        }
                        globalData[n] = 0;
                        ++n;
                    }
                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_READ_IMG_SEC:
                    // read image sector
                    var returnCode = STATUS_COMPLETE | ERROR_INVALID_DRIVE;

                    globalData = [];
                    if (driveInfo[globalCurDrive].attribs != 0xff){
                       for (i = 0; i < 257; ++i){
                            globalData[i+1]=driveInfo[globalCurDrive].image[globalLBAOffset + i];
                        }
                        WriteDataPort(STATUS_OK);
                        return;
                    }
                    WriteDataPort(returnCode);
                    break;

                case CMD_WRITE_IMG_SEC:
                    // write image sector
                    var returnCode = STATUS_COMPLETE | ERROR_INVALID_DRIVE;

                    if (driveInfo[globalCurDrive].attribs != 0xff)
                    {
                        if (driveInfo[globalCurDrive].attribs & 1)
                        {
                            WriteDataPort(STATUS_COMPLETE | ERROR_READ_ONLY);
                            return;
                        }

                        for (i = 0; i < 256; ++i)
                        {
                            driveInfo[globalCurDrive].image[globalLBAOffset + i ]=globalData[i];
                        }
                    }
                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_SER_IMG_INFO:
                    // serialise the current image information
                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_VALID_IMG_NAMES:
                    // read the imgInfo structures back out of eeprom,
                    // or 'BOOTDRV.CFG' if present (gets precidence)
                    // try to read the boot config file
                    var Ret=STATUS_OK,d,arg=[];

                    arg[0]=ARGV.disk0.toUpperCase();
                    arg[1]=ARGV.disk1.toUpperCase();
                    arg[2]=ARGV.disk2.toUpperCase();
                    arg[3]=ARGV.disk3.toUpperCase();

                    for (d = 0; d < 4; ++d){

                      if (arg[d].length > 0){
                        newDiskName=arg[d];
                        globalData[0]=d;

                        for (i = 0; i < aDisks.length; ++i){
                          if (aDisks[i][0].n == newDiskName){
                            driveInfo[globalData[0]].filename = newDiskName;
                            driveInfo[globalData[0]].attribs=0;
                            driveInfo[globalData[0]].image=aDisks[i][0].d;
                          }
                          if (i==aDisks.length){Ret=0x44}
                        }
                      }

                    }
                    WriteDataPort(Ret);
                    break;

                case CMD_IMG_UNMOUNT:
                    driveInfo[byteValueLatch].attribs=255;
                    WriteDataPort(STATUS_OK);
                    break;

         // Utility commands.

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

                case CMD_GET_PORT_DDR;
                   // get portb direction register
                   WriteDataPort(TRISB);

                case CMD_WRITE_PORT;
                   // write port B value
                   LATB = byteValueLatch;
                   WriteEEPROM(EE_PORTBVALU, byteValueLatch);
                   WriteDataPort(STATUS_OK);

                case CMD_READ_AUX) // read porta - latch & aux pin on dongle
                   WriteDataPort(LatchedAddress);


~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


                case CMD_GET_CARD_TYPE:
                    byteValueLatch = nVal;
                    WriteDataPort(3);
                    break;

                case CMD_GET_FW_VER:
                    byteValueLatch = nVal;
                    WriteDataPort(2);
                    break;

                case CMD_GET_BL_VER:
                    byteValueLatch = nVal;
                    WriteDataPort(1);
                    break;

		case CMD_GET_CFG_BYTE:
		    // read config byte
	            WriteDataPort(configByte);
		    break;

                case CMD_SET_PORT_DDR:
                   // set portb direction register
                   WriteDataPort(STATUS_OK);

                case CMD_READ_PORT:
                    // read portb
                    WriteDataPort(0xff);
                    break;

		case CMD_SET_CFG_BYTE:
		    // write config byte
                    configByte = byteValueLatch;
                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_GET_HEARTBEAT:
                   // get heartbeat - this may be important as we try and fire
                   // an irq very early to get the OS hooked before its first
                   // osrdch call. the psp may not be enabled by that point,
                   // so we have to wait till it is.
                   //
                   WriteDataPort(heartbeat);
                   heartbeat ^= 0xff;
                   break;

                default:
                    WriteDataPort(STATUS_OK);
            }
            break;
        }

        case WRITE_DATA_REG:{
            // write data port.
            // must have poked 255 at port 3 before starting to poke data here.
            globalData[globalIndex]=nVal
            ++globalIndex
            WriteDataPort(STATUS_BUSY);
            break;
        }

        case LATCH_REG:{
           // latch the written value
            byteValueLatch = nVal;
            WriteDataPort(byteValueLatch);
            break;
        }
    }
    tDebug("w" + fHexWord(nAddr)+"->"+ HEX(nVal)+":"+
           "a" + HEX(ACC) + "x" + HEX(XIR) + "y" + HEX(YIR) + "pc" + fHexWord(PCR));
}

/*
;--------------------------------------------------------------
;
; WriteDataPort(nVal)
;
; Write value nVal to data latch
;
;--------------------------------------------------------------
*/

function WriteDataPort(nVal)
{
	LATD = nVal;
}

/*
;--------------------------------------------------------------
;
; tDebug(sLine)
;
; Write sLine to debug window if debug<>0
;
;--------------------------------------------------------------
*/

function tDebug(sLine)
{
	if (debug) {
		document.getElementById('fDebug').value = document.getElementById('fDebug').value + sLine + "\r";
		document.getElementById("fDebug").scrollTop = document.getElementById("fDebug").scrollHeight; }
}

function tMessage(sLine)
{
	document.getElementById('fDebug').value = document.getElementById('fDebug').value + sLine + "\r";
	document.getElementById("fDebug").scrollTop = document.getElementById("fDebug").scrollHeight;
}

function matchRuleShort(str, rule)
{
	return new RegExp("^" + rule.split("*").join(".*") + "$").test(str);
}
