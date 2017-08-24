/*
;==============================================================
; B400_MMC.js, AtoMMC emulation at #B400/1/2/3          KC 2017
;--------------------------------------------------------------
;
; Changed functions in HTeMuLator.html:
;
; fIOR(a,A)	, expanded with fMMCRead(a)
; fIOW(a,v)	, expanded with fMMCWrite(a,v)
; STBA(a,v,A)	, expanded to 32kB RAM and 8kB video RAM
; LDBA(a,A)	, expanded to 32kB RAM and 8kB video RAM
;		  changed AXR1_ROM with SDROM_ROM
; VARG_type()	, added prog and disk property
; fLogin()	, added loading B400MMC.js
; 		  added loading Disk001.js
; 		  added fDebug textarea
;
;==============================================================

;==============================================================
; DEFINITION OF VARIABLES
;==============================================================
*/

var
// PIC registers
    CMD_REG		= 0x00,
    LATCH_REG 		= 0x01,
    READ_DATA_REG	= 0x02,
    WRITE_DATA_REG	= 0x03,

// CMD_REG_COMMANDS
    CMD_FILE_OPEN_IMG	= 0x12,
    CMD_INIT_READ	= 0x20,
    CMD_INIT_WRITE	= 0x21,

// SDOS_LBA_REG commands
    CMD_LOAD_PARAM	= 0x40,
    CMD_GET_IMG_STATUS	= 0x41,
    CMD_GET_IMG_NAME	= 0x42,
    CMD_READ_IMG_SEC	= 0x43,
    CMD_WRITE_IMG_SEC	= 0x44,
    CMD_SER_IMG_INFO	= 0x45,
    CMD_VALID_IMG_NAMES	= 0x46,
    CMD_IMG_UNMOUNT	= 0x47,

// UTIL_CMD_REG commands
    CMD_GET_CARD_TYPE	= 0x80,
    CMD_GET_FW_VER	= 0xE0,
    CMD_GET_BL_VER	= 0xE1,

// Status codes
    STATUS_OK		= 0x3F,
    STATUS_COMPLETE	= 0x40,
    STATUS_EOF		= 0x60,
    STATUS_BUSY		= 0x80,
    ERROR_MASK		= 0x3F,

// To be or'd with STATUS_COMPLETE
    ERROR_NO_DATA	= 0x08,
    ERROR_INVALID_DRIVE	= 0x09,
    ERROR_READ_ONLY	= 0x0A,
    ERROR_ALREADY_MOUNT	= 0x0A,
    ERROR_TOO_MANY_OPEN	= 0x12,

// Global vars

    dFilename = "",			// Filename loaded diskfile
    dDisk,				// Array with diskimage loaded diskfile

    debug = 0,				// Output to debug window on/off

// AtoMMC vars
    LATD = 255,				// Data latch
    globalData = [],			// Data array 
    globalIndex = 0,			// Data array pointer
    byteValueLatch,			// Latch bytevalue
    globalLBAOffset = 0;		// Disk image array pointer

// Drive info
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

    lastDriveNo = -1;

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
    var Ret = 0;
    switch (A=nAddr&7){
        case CMD_REG:
            Ret = LATD;
            break;
        case READ_DATA_REG:
            WriteDataPort((globalData[globalIndex]));
            ++globalIndex;
            Ret = LATD;
            break;
        default:
            WriteDataPort(STATUS_OK);
    }
    tDebug("Read " + nAddr.toString(16) + "->"+ ((typeof Ret=="undefined") ? "-" : Ret.toString(16))  + ","+ globalIndex)
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
            LatchedData = nVal;
            WriteDataPort(STATUS_BUSY);
            switch (nVal){

                case CMD_FILE_OPEN_IMG:
                    // open the file as backing image for virtual floppy drive
                    // drive number in globaldata[0] followed by asciiz name.
                    var    i = globalData[0],
                        m = 1,
                        n = 0,
                        newDiskName = "";

                    while(globalData[m] && m < 12){
                        newDiskName = newDiskName + String.fromCharCode(globalData[m]) ;
                        ++m;
                        ++n;
                    }
                    driveInfo[i].filename = newDiskName;
                    driveInfo[i].attribs=0;
                    ++n;

                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_INIT_READ:
                    // All data read requests must send CMD_INIT_READ before begining reading
                    // data from READ_DATA_PORT. After execution of this command the first byte 
                    // of data may be read from the READ_DATA_PORT.
                    WriteDataPort(globalData[0]);
                    globalIndex = 0;
                    break;

                case CMD_INIT_WRITE:
                    // all data write requests must send CMD_INIT_WRITE here before poking data at 
                    // WRITE_DATA_REG    
                    // globalDataPresent is a flag to indicate whether data is present in the bfr.
                    globalIndex = 0;
                    break;

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

                    if (driveInfo[globalCurDrive].attribs != 0xff){
                       for (i = 0; i < 257; ++i){
                            globalData[i]=driveInfo[globalCurDrive].image[globalLBAOffset + i ];
                        }
                        WriteDataPort(STATUS_OK);
                        return STATUS_OK;
                    }
                    driveInfo[globalCurDrive].attribs = 0xff;
                    returnCode |= STATUS_COMPLETE;
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
                    driveInfo[0].filename=dFilename;
                    driveInfo[0].attribs=0
                    driveInfo[0].image=dDisk.concat([]);
                    driveInfo[2].filename="DISK3";
                    driveInfo[2].attribs=0
                    driveInfo[2].image=dDisk.concat([]);
                    WriteDataPort(STATUS_OK);
                    break;

                case CMD_IMG_UNMOUNT:
                    driveInfo[byteValueLatch].attribs=255;
                    WriteDataPort(STATUS_OK);
                    break;

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

                default:
                    WriteDataPort(STATUS_OK);
            }
            break;
        }

        case READ_DATA_REG: {
            // read data port.
            //
            // any data read requests must be primed by writing CMD_INIT_READ (0x3f) here
            // before the 1st read.
            //
            // this has to be done this way as the PIC hardware only latches the address 
            // on a WRITE.
            WriteDataPort((globalData[globalIndex]));
            ++globalIndex;
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
    tDebug("Write "+nAddr.toString(16)+","+ nVal.toString(16));
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

function WriteDataPort(nVal){
    LATD=nVal
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
    if (debug){
        document.getElementById('fDebug').value = document.getElementById('fDebug').value + sLine + "\r"
        document.getElementById("fDebug").scrollTop = document.getElementById("fDebug").scrollHeight
    }
}

function tMessage(sLine)
{
        document.getElementById('fDebug').value = document.getElementById('fDebug').value + sLine + "\r"
        document.getElementById("fDebug").scrollTop = document.getElementById("fDebug").scrollHeight
}

