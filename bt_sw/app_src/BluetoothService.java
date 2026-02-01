package com.veepoo.hband.ble;

import android.app.ActivityManager;
import android.app.Application;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Binder;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.Message;
import android.os.Process;
import android.os.SystemClock;
import android.os.Vibrator;
import android.service.notification.NotificationListenerService;
import android.text.TextUtils;
import android.text.format.DateFormat;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;
import androidx.constraintlayout.core.motion.utils.TypedValues;
import androidx.core.content.ContextCompat;
import androidx.core.view.MotionEventCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import androidx.work.Data;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.autonavi.amap.mapcore.AMapEngineUtils;
import com.goodix.ble.libcomx.util.HexStringBuilder;
import com.google.gson.JsonObject;
import com.jieli.jl_bt_ota.constant.BluetoothConstant;
import com.jieli.jl_bt_ota.util.CHexConver;
import com.jieli.jl_bt_ota.util.JL_Log;
import com.jieli.jl_rcsp.constant.WatchConstant;
import com.orhanobut.logger.Logger;
import com.orhanobut.logger.Printer;
import com.veepoo.hband.HBandApplication;
import com.veepoo.hband.R;
import com.veepoo.hband.R2;
import com.veepoo.hband.activity.MainActivity;
import com.veepoo.hband.activity.MusicOpraterService;
import com.veepoo.hband.activity.ai.manager.AIPreviewSendManger;
import com.veepoo.hband.activity.ai.manager.WatchRecordingManager;
import com.veepoo.hband.activity.callback.OnBleWriteCallback;
import com.veepoo.hband.activity.connected.backdoor.JLOTATestActivity;
import com.veepoo.hband.activity.connected.backdoor.ShowLogActivity;
import com.veepoo.hband.activity.connected.camera.CameraActivity;
import com.veepoo.hband.activity.connected.oad.BluetrumOTAActivity;
import com.veepoo.hband.activity.connected.oad.JLOTAActivity;
import com.veepoo.hband.activity.connected.setting.AGPSSettingActivity;
import com.veepoo.hband.activity.connected.setting.photo_album.PhotoAlbumTransferManager;
import com.veepoo.hband.activity.connected.setting.video_dial.manager.WatchFaceTransferManager;
import com.veepoo.hband.activity.gps.util.GPSUtil;
import com.veepoo.hband.ai.AIOptManager;
import com.veepoo.hband.ble.BleWriteAndResponseManager;
import com.veepoo.hband.ble.BluetoothService;
import com.veepoo.hband.ble.ConnectDetails;
import com.veepoo.hband.ble.bluetrum.ota.BluetrumBleManager;
import com.veepoo.hband.ble.readmanager.AGPSManager;
import com.veepoo.hband.ble.readmanager.AlarmRangeHandler;
import com.veepoo.hband.ble.readmanager.AutoCallbackHandler;
import com.veepoo.hband.ble.readmanager.BPHandler;
import com.veepoo.hband.ble.readmanager.BatteryHandler;
import com.veepoo.hband.ble.readmanager.DeviceFunctionHandler;
import com.veepoo.hband.ble.readmanager.EcgAppHandler;
import com.veepoo.hband.ble.readmanager.EcgDeviceManager;
import com.veepoo.hband.ble.readmanager.HeartWarningHandler;
import com.veepoo.hband.ble.readmanager.HuitopUIUpdateHandler;
import com.veepoo.hband.ble.readmanager.KDeviceBTHandler;
import com.veepoo.hband.ble.readmanager.LongseatHanlder;
import com.veepoo.hband.ble.readmanager.NightTurnWristHandler;
import com.veepoo.hband.ble.readmanager.PhotoAlbumHandler;
import com.veepoo.hband.ble.readmanager.PwdHandler;
import com.veepoo.hband.ble.readmanager.ScreenLightHanlder;
import com.veepoo.hband.ble.readmanager.ScrenLightTimeHandler;
import com.veepoo.hband.ble.readmanager.SportHandler;
import com.veepoo.hband.ble.readmanager.VideoDialHandler;
import com.veepoo.hband.ble.readmanager.WorldClockHandler;
import com.veepoo.hband.ble.readmanager.multi_lead.ECGMultiLeadDetectHandler;
import com.veepoo.hband.ble.work.BleConnectWorker;
import com.veepoo.hband.config.IntentPut;
import com.veepoo.hband.config.SputilVari;
import com.veepoo.hband.handler.ContactHandler;
import com.veepoo.hband.handler.GpsDataOprate;
import com.veepoo.hband.httputil.HttpUtil;
import com.veepoo.hband.j_l.RcspAuthManager;
import com.veepoo.hband.j_l.classic.ClassicBTManager;
import com.veepoo.hband.j_l.dial.WatchManager;
import com.veepoo.hband.j_l.ota.JLOTAManager;
import com.veepoo.hband.j_l.send.IBleOp;
import com.veepoo.hband.j_l.send.OnThreadStateListener;
import com.veepoo.hband.j_l.send.OnWriteDataCallback;
import com.veepoo.hband.j_l.send.SendBleDataThread;
import com.veepoo.hband.modle.BindDataBean;
import com.veepoo.hband.modle.BleCmd;
import com.veepoo.hband.modle.EAlarmRangeType;
import com.veepoo.hband.modle.EWatchUIType;
import com.veepoo.hband.modle.UserBean;
import com.veepoo.hband.phone.MessageNotifyCollectService;
import com.veepoo.hband.phone.PhoneStatReceiver;
import com.veepoo.hband.sql.SqlHelperUtil;
import com.veepoo.hband.util.AIRecordingUtil;
import com.veepoo.hband.util.AfterGetDeviceNumber;
import com.veepoo.hband.util.AppSPUtil;
import com.veepoo.hband.util.BaseUtil;
import com.veepoo.hband.util.BleInfoUtil;
import com.veepoo.hband.util.BluetoothUtil;
import com.veepoo.hband.util.ConnectTestManager;
import com.veepoo.hband.util.ConvertHelper;
import com.veepoo.hband.util.FileUtilQ;
import com.veepoo.hband.util.HomeFunctionShowUtil;
import com.veepoo.hband.util.LocalBroadcastSender;
import com.veepoo.hband.util.NotificationUtil;
import com.veepoo.hband.util.PhoneCallUtil;
import com.veepoo.hband.util.SmsUtil;
import com.veepoo.hband.util.SpUtil;
import com.veepoo.hband.util.ToastUtils;
import com.veepoo.hband.util.UploadValveUtil;
import com.veepoo.hband.util.WeatherDataSendingStatusUtil;
import com.veepoo.hband.util.log.AppLogManager;
import com.veepoo.hband.util.log.HBLogger;
import com.veepoo.hband.util.thread.HBThreadPools;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.Method;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.Timer;
import java.util.TimerTask;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import no.nordicsemi.android.log.LogContract;
import no.nordicsemi.android.support.v18.scanner.BluetoothLeScannerCompat;
import no.nordicsemi.android.support.v18.scanner.ScanCallback;
import no.nordicsemi.android.support.v18.scanner.ScanFilter;
import no.nordicsemi.android.support.v18.scanner.ScanResult;
import no.nordicsemi.android.support.v18.scanner.ScanSettings;
import retrofit2.Response;
import rx.Subscriber;
import solid.ren.skinlibrary.utils.SkinListUtils;

/* loaded from: classes3.dex */
public class BluetoothService extends Service implements BleBroadCast, IntentPut, OnBleWriteCallback, BleProfile, IBleOp, BleWriteAndResponseManager.OnResponseTimeoutListener {
    public static final String ACTION_JL_OTA_RECONNECT_FAILED = "_ACTION_JL_OTA_RECONNECT_FAILED";
    public static final String ACTION_WRITE_LOG = "_ACTION_WRITE_LOG";
    public static final String BLE_CONNECT_ACTION = "_BLE_CONNECT_ACTION";
    private static final String DEFAULT_PWD = "0000";
    public static final String KEY_LEVEL = "_KEY_LEVEL";
    public static final String KEY_LOG = "_KEY_LOG";
    private static final int LOOP_TIME = 600;
    public static final int PASSWORD_CALLBACK_TIMEOUT = 20000;
    private static final int PAUSE_SECOND = 5;
    public static final String PWD_ACTION = "【密码校验发送】";
    public static final int REQ_MTU = 247;
    private static final int SCAN_COUNT = 2;
    private static final int SCAN_SECOND = 10;
    public static final long SOS_INTERVAL = 30000;
    private static final String TAG = "BluetoothService";
    BleReadManager bleReadManager;
    ExecutorService cmdSendPool;
    private BluetoothGattCharacteristic jlBleNotification;
    private BluetoothGattCharacteristic jlBleWrite;
    Timer mBigSendCmdTimer;
    private BluetoothAdapter mBluetoothAdapter;
    private String mBluetoothDevicePwd;
    private BluetoothGatt mBluetoothGatt;
    protected BluetoothManager mBluetoothManager;
    private BluetoothDevice mDevice;
    String mFileNamePath;
    Uri mFileUiPath;
    FileUtilQ mFileUtilQ;
    HuitopUIUpdateHandler mHuitopUIUpdateHandler;
    boolean mIsBinFile;
    boolean mIsNeedFlip;
    PhoneStatReceiver mPhoneStatReceiver;
    ScanCallback mScanCallback;
    BluetoothLeScannerCompat mScanner;
    private SendBleDataThread mSendBleDataThread;
    SmsUtil mSmsUtil;
    EWatchUIType mWatchUIType;
    private MediaPlayer mediaPlayer;
    ScheduledExecutorService scheduledThreadPool;
    private BluetoothGattCharacteristic vpProtocolBleNotification;
    private static final String TAG_JL = "BluetoothService-杰理-";
    private static final String TAG_JLOTA = "BluetoothService-杰理-JLOTA";
    private static final String TAG_BLUETRUM = "BluetoothService-中科-";
    private static int previousMuteMode = -1;
    public static boolean isJLNotificationOpen = false;
    public static boolean isOpenBluetrumService = false;
    public static volatile boolean hasSendPwdCMD = false;
    public static ConnectDetails.ConnectType CONNECT_TYPE = ConnectDetails.ConnectType.UNKNOWN;
    static int current_block = 1;
    static int all_block = 1;
    static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss||SSS", Locale.US);
    public static boolean isFindJLService = false;
    private Context mContext = this;
    ComponentName notifyListenComponent = null;
    private String mDeviceName = "";
    private String mBluetoothDeviceAddress = "";
    private boolean isNeedAutoConnect = false;
    final LinkedBlockingQueue<BleCmd> mCommandList = new LinkedBlockingQueue<>();
    boolean isScanning = false;
    private String autoScanAddress = "";
    private String bpOption = "";
    boolean isReadingSetting = true;
    final int B8_TIME = 500;
    final int READ_SETTING_TIME = 3000;
    final int DELAYMILLIS = R2.drawable.device_sport_history_cell_67;
    private final ContactHandler mContactHandler = ContactHandler.INSTANCE.getInstance();
    private final GpsDataOprate mGpsDataHandler = new GpsDataOprate(this.mContext);
    private boolean hasUIWiped = false;
    Handler mHandler = new Handler(Looper.getMainLooper()) { // from class: com.veepoo.hband.ble.BluetoothService.1
        @Override // android.os.Handler
        public void handleMessage(Message message) {
            String str;
            super.handleMessage(message);
            int i = message.what;
            if (i == -2) {
                str = "寻找成功...";
                Toast.makeText(BluetoothService.this.mContext, "寻找成功...", 1).show();
            } else if (i == -1) {
                str = "寻找服务...";
                Toast.makeText(BluetoothService.this.mContext, "寻找服务...", 1).show();
            } else if (i == 0) {
                str = "寻找失败0......";
                Toast.makeText(BluetoothService.this.mContext, "寻找失败0......", 1).show();
            } else if (i == 1) {
                str = "寻找失败1...有服务并没有找到相应服务...";
                Toast.makeText(BluetoothService.this.mContext, "寻找失败1...有服务并没有找到相应服务...", 1).show();
            } else if (i == 2) {
                str = "寻找失败2...";
                Toast.makeText(BluetoothService.this.mContext, "寻找失败2...", 1).show();
            } else if (i != 3) {
                str = "";
            } else {
                str = "寻找失败3...";
                Toast.makeText(BluetoothService.this.mContext, "寻找失败3...", 1).show();
            }
            HBLogger.bleChangeLog(str);
        }
    };
    boolean isRecoderWriteChange = true;
    boolean isRecoderReconnect = true;
    boolean isReadDataTime10 = true;
    private IBinder binder = new LocalBinder();
    Timer mScanScheTimer = new Timer();
    Timer mDelayTimer = new Timer();
    int mScanCount = 0;
    boolean isStartScanLooper = false;
    AutoCallbackHandler autoCallbackHandler = new AutoCallbackHandler();
    boolean isFindVPProtocolService = false;
    boolean isFindUiService = false;
    boolean isFindBluetrumService = false;
    boolean pasueSend = false;
    private int bleConnect133ErrorCount = 0;
    private String ble133Address = null;
    private String ble133DeviceName = null;
    private boolean isManualDisconnect = false;
    private boolean isManualConnect = false;
    private volatile boolean isUITransferNeedWait = false;
    private final BluetoothGattCallback mGattCallback = new BluetoothGattCallback() { // from class: com.veepoo.hband.ble.BluetoothService.7
        @Override // android.bluetooth.BluetoothGattCallback
        public void onConnectionStateChange(BluetoothGatt bluetoothGatt, int i, int i2) throws InterruptedException, NoSuchMethodException, SecurityException {
            super.onConnectionStateChange(bluetoothGatt, i, i2);
            HBandApplication.dismissDeviceAIDialTransferDialog();
            HBandApplication.isUpdatingUI = false;
            AppSPUtil.setPWDDfuLangState(false);
            AIOptManager.getInstance().unInit();
            WatchFaceTransferManager.getInstance().resetData();
            WeatherDataSendingStatusUtil.getInstance().init();
            KDeviceBTHandler.getInstance().resetData();
            BluetoothService.hasSendPwdCMD = false;
            SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.FUCTION_LONG_CLICK_LOCK, false);
            SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.IS_OPEN_LONG_CLICK_LOCK, false);
            BleWriteAndResponseManager.clearRecodes();
            HBandApplication.TEN_MINUTE_READ_COUNT = 0;
            SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.IS_HAVE_BT_CALL, false);
            WatchRecordingManager.isInDeviceAIFunctionUse = false;
            KDeviceBTHandler.hasReceiveBTReportAction = false;
            AppSPUtil.setHasGetFirstGetBDReport(true);
            BleReadManager.setCheckPwdPassFlag(false);
            RcspAuthManager.getInstance().setAuthPass(false);
            ClassicBTManager.getInstance().resetDiscovered();
            DeviceFunctionHandler.resetFunctionPackage4();
            String str = "-----------connect state-----------" + HBandApplication.appInSystemInfo();
            Logger.t(BluetoothService.TAG).i(str, new Object[0]);
            HBLogger.bleConnectLog(str);
            String bluetoothOprateState = BluetoothService.this.getBluetoothOprateState(i);
            String str2 = "蓝牙操作状态码=" + i + SkinListUtils.DEFAULT_JOIN_SEPARATOR + bluetoothOprateState + ",蓝牙连接状态=" + BluetoothService.this.getBluetoothState(i2);
            Logger.t(BluetoothService.TAG).i(str2, new Object[0]);
            Logger.t(BluetoothService.TAG_JLOTA).i(str2, new Object[0]);
            String str3 = HBandApplication.isBackground ? " -onConnectionStateChange- 【后台自动回连】 " : " -onConnectionStateChange- 【前台手动连接】 ";
            HBLogger.bleConnectLog(str3 + str2);
            boolean z = SpUtil.getBoolean(BluetoothService.this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
            if (i2 == 0) {
                ToastUtils.showDebug("断开连接:" + bluetoothOprateState);
                BluetoothService.this.sendBleConnectAction("断开连接:" + bluetoothOprateState);
                DeviceFunctionHandler.IS_HAVE_TWO_PACKAGE = false;
                JLWatchFaceManager.getInstance().release();
                JLOTAManager.getInstance().handlerBtDeviceConnection(bluetoothGatt.getDevice(), i2);
                JLOTAManager.getInstance().setJLOTAInitSuccess(false);
                if (JLOTAActivity.isReconnect || JLOTATestActivity.isReconnect) {
                    Logger.t(BluetoothService.TAG_JLOTA).e("*****处于杰理OTA重连中，断开*****", new Object[0]);
                    BluetoothService.this.bleCloseByOTA133();
                    LocalBroadcastManager.getInstance(BluetoothService.this.mContext).sendBroadcast(new Intent(BluetoothService.ACTION_JL_OTA_RECONNECT_FAILED));
                    return;
                }
            }
            if (i != 133 || z || BluetoothService.this.bleReadManager == null) {
                BluetoothService.this.ble133Address = null;
                if (i == 257) {
                    BluetoothService.this.sendBleConnectAction("蓝牙操作崩溃:" + bluetoothOprateState);
                    Logger.t(BluetoothService.TAG).i(" 蓝牙操作崩溃,操作状态码（GATT_FAILURE）code = 257", new Object[0]);
                    HBLogger.bleConnectLog(str3 + " 蓝牙操作崩溃,操作状态码（GATT_FAILURE）code = 257");
                    BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_GATT_FAILURE);
                    if (BluetoothService.this.isStartScanLooper) {
                        LocalBroadcastManager.getInstance(BluetoothService.this.mContext).sendBroadcast(new Intent(BleBroadCast.SCAN_DEVICE_OVET_TIME));
                        return;
                    } else {
                        BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_CODE_257, ConnectTestManager.Result.ERROR_GATT_FAILURE);
                        return;
                    }
                }
                if (i2 != 2) {
                    if (i2 == 0) {
                        HBLogger.bleConnectLog(str3 + " 连接断开：" + bluetoothOprateState);
                        BluetoothService.this.sendBleConnectAction("连接断开:" + bluetoothOprateState);
                        BluetoothService.this.mCommandList.clear();
                        SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
                        SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.IS_HAVE_BT_CALL, false);
                        SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.BLE_PWD_CALLBACK, false);
                        SqlHelperUtil.updateBleConnect(BluetoothService.this.mContext);
                        Logger.t(BluetoothService.TAG).i("BluetoothGattCallback:断开", new Object[0]);
                        BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_SUCCESS);
                        if (!BluetoothService.this.isStartScanLooper) {
                            if (BluetoothService.this.isManualDisconnect) {
                                BluetoothService.this.stopLooper();
                                BluetoothService.this.stopScan();
                                BluetoothService.this.stopLooper();
                                BluetoothService.this.stopScan();
                                HBLogger.bleConnectLog("==============================> 手动断开成功....");
                                return;
                            }
                            if (BluetoothService.this.bleReadManager != null) {
                                BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.2
                                    @Override // java.lang.Runnable
                                    public void run() throws InterruptedException, NoSuchMethodException, SecurityException {
                                        BluetoothService.this.autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_DISCONNECT);
                                    }
                                }, 1000L);
                            }
                        } else {
                            HBLogger.bleConnectLog("在循环扫描中断开了");
                        }
                        BluetoothService.this.mDevice = null;
                        BluetoothService.this.stopSendDataThread();
                        return;
                    }
                    return;
                }
                BluetoothService.this.mHandler.removeCallbacksAndMessages(null);
                BluetoothService.this.isManualDisconnect = false;
                BluetoothService.this.sendBleConnectAction("连接成功");
                BluetoothService.this.tellMainConnecting(bluetoothGatt.getDevice().getAddress(), "连接成功");
                AppSPUtil.setSupportBloodGlucoseUnit(false);
                AppSPUtil.setSupportUricAcidUnit(false);
                AppSPUtil.setSupportBloodFatsUnit(false);
                NotificationUtil.cancel(102);
                DeviceFunctionHandler.IS_HAVE_TWO_PACKAGE = false;
                BluetoothService.this.bleConnect133ErrorCount = 0;
                SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.BLE_IS_DFULANG, false);
                BluetoothService.isFindJLService = false;
                BluetoothService.this.isFindUiService = false;
                BluetoothService.this.isFindVPProtocolService = false;
                BluetoothService.this.jlBleNotification = null;
                BluetoothService.this.vpProtocolBleNotification = null;
                boolean zDiscoverServices = BluetoothService.this.mBluetoothGatt.discoverServices();
                Logger.t(BluetoothService.TAG_JLOTA).i("蓝牙连接成功，扫描服务=" + zDiscoverServices, new Object[0]);
                HBLogger.bleConnectLog(str3 + " 蓝牙连接成功，开始扫描服务 ： discoverServices = " + zDiscoverServices);
                if (!zDiscoverServices) {
                    BluetoothService.this.sendBleConnectAction("服务发现失败，去断开");
                    Logger.t(BluetoothService.TAG).i("服务->蓝牙连接成功，没有发现服务", new Object[0]);
                    HBLogger.bleConnectLog("服务->失败");
                    Logger.t(BluetoothService.TAG).i("BluetoothGattCallback:服务失败，断开", new Object[0]);
                    BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_NOT_FIND_SERVICE);
                    if (!BluetoothService.this.isStartScanLooper) {
                        BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_SUCCESS);
                    }
                }
                PhotoAlbumTransferManager.getInstance().reset();
                BluetoothService.this.mDevice = bluetoothGatt.getDevice();
                BluetoothService.this.startSendDataThread();
                Logger.t(BluetoothService.TAG).i("服务->蓝牙连接成功，开始发现服务=" + zDiscoverServices, new Object[0]);
                return;
            }
            HBLogger.bleConnectLog(str3 + "连接失败，133错误。 是否是出于轮询扫描中：" + BluetoothService.this.isStartScanLooper + " , 是否出于后台中：" + HBandApplication.isBackground);
            BluetoothService bluetoothService = BluetoothService.this;
            StringBuilder sb = new StringBuilder();
            sb.append("连接失败133:");
            sb.append(bluetoothOprateState);
            bluetoothService.sendBleConnectAction(sb.toString());
            if (BluetoothService.this.isStartScanLooper && !HBandApplication.isBackground) {
                HBLogger.bleConnectLog("------------------> 【当处于轮询扫描且在前台时直接释放BLE，不直接去连接】 <--------------------");
                BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_FAIL_133);
                return;
            }
            if (!ConnectTestManager.isEnableConnectTest) {
                BluetoothService.this.ble133Address = bluetoothGatt.getDevice().getAddress();
                BluetoothService.this.ble133DeviceName = bluetoothGatt.getDevice().getName();
                BluetoothService.access$1508(BluetoothService.this);
                String str4 = " 第" + BluetoothService.this.bleConnect133ErrorCount + "次出现133错误";
                ToastUtils.showDebug(str4);
                HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + str3 + str4);
                if (BluetoothService.this.bleConnect133ErrorCount == 3) {
                    BluetoothService.this.bleConnect133ErrorCount = 0;
                    HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + str3 + " 连续三次133错误，提示用户重启蓝牙");
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_CODE_133);
                    if (HBandApplication.isBackground) {
                        NotificationUtil.showBluetoothRestart(BluetoothService.this.mContext);
                    }
                }
                BluetoothService.this.autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_CONNECT);
                return;
            }
            ConnectTestManager.getInstance().increaseError133Count();
            if (ConnectTestManager.isOpenConnectOptimize) {
                BluetoothService.access$1508(BluetoothService.this);
                ToastUtils.show("连接测试优化：第" + BluetoothService.this.bleConnect133ErrorCount + "次133错误");
                Logger.t("连接测试").e("连接测试优化：第" + BluetoothService.this.bleConnect133ErrorCount + "次133错误", new Object[0]);
                if (BluetoothService.this.bleConnect133ErrorCount == 3) {
                    BluetoothService.this.bleConnect133ErrorCount = 0;
                    Logger.t("连接测试").e("连接测试优化：第三次133错误，通知连接失败", new Object[0]);
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_CODE_133);
                    return;
                } else {
                    BluetoothService.this.ble133Address = bluetoothGatt.getDevice().getAddress();
                    BluetoothService.this.ble133DeviceName = bluetoothGatt.getDevice().getName();
                    SqlHelperUtil.clearAllUnBinder();
                    LocalBroadcastSender.getInstance().sendDisconnectAction();
                    BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.1
                        @Override // java.lang.Runnable
                        public void run() {
                            ToastUtils.show("连接测试优化：第" + BluetoothService.this.bleConnect133ErrorCount + "次133错误，-> Connecting");
                            Logger.t("连接测试").e("连接测试优化：第" + BluetoothService.this.bleConnect133ErrorCount + "次133错误，-> Connecting", new Object[0]);
                            LocalBroadcastSender.getInstance().sendConnectActionByManual(BluetoothService.this.ble133DeviceName, BluetoothService.this.ble133Address, true);
                        }
                    }, 1000L);
                    return;
                }
            }
            ToastUtils.show("连接测试：133错误");
            BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_CODE_133);
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onServicesDiscovered(BluetoothGatt bluetoothGatt, int i) throws InterruptedException, NoSuchMethodException, SecurityException {
            super.onServicesDiscovered(bluetoothGatt, i);
            BluetoothService.isJLNotificationOpen = false;
            BluetoothService.this.isFindVPProtocolService = false;
            BluetoothService.isFindJLService = false;
            BluetoothService.this.isFindUiService = false;
            BluetoothService.this.isFindBluetrumService = false;
            Logger.t(BluetoothService.TAG).i("服务->发现服务状态=" + i, new Object[0]);
            BleReadManager.setCheckPwdPassFlag(false);
            if (i == 0) {
                BluetoothService.this.sendBleConnectAction("连接成功，服务发现成功");
                ClassicBTManager.getInstance().resetDiscovered();
                BluetoothDevice device = bluetoothGatt.getDevice();
                String name = device.getName();
                String address = device.getAddress();
                Logger.t(BluetoothService.TAG).i("服务->发现服务成功= 经典蓝牙 name = " + name + " , address = " + address + " , type = " + device.getType(), new Object[0]);
                NotificationUtil.cancel(102);
                Printer printerT = Logger.t(BluetoothService.TAG);
                StringBuilder sb = new StringBuilder();
                sb.append("服务->发现服务成功，弹出输入框,是否要手动重新连接:");
                sb.append(BluetoothService.this.isNeedAutoConnect);
                printerT.i(sb.toString(), new Object[0]);
                HBLogger.bleConnectLog("服务->发现服务成功");
                Iterator<BluetoothGattService> it = bluetoothGatt.getServices().iterator();
                while (it.hasNext()) {
                    UUID uuid = it.next().getUuid();
                    Logger.t(BluetoothService.TAG).i("服务->发现服务uuid=" + uuid.toString(), new Object[0]);
                    if (uuid.equals(BleProfile.OAD_UUID) || uuid.equals(BleProfile.OAD_UUID_EP02_SERVICE)) {
                        SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.BLE_IS_DFULANG, true);
                        SpUtil.saveString(BluetoothService.this.mContext, SputilVari.BLE_DFULANG_TYPE, SputilVari.OAD_NORIC);
                    }
                    if (uuid.equals(BleProfile.OAD_UUID_SERVICE_HUIDING)) {
                        SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.BLE_IS_DFULANG, true);
                        SpUtil.saveString(BluetoothService.this.mContext, SputilVari.BLE_DFULANG_TYPE, SputilVari.OAD_HUIDING);
                    }
                }
                BluetoothService.this.bleSendBroadcast(BleBroadCast.OAD_SCAN_AND_FINDER_SERVER);
                for (BluetoothGattService bluetoothGattService : bluetoothGatt.getServices()) {
                    UUID uuid2 = bluetoothGattService.getUuid();
                    Logger.t(BluetoothService.TAG).i("服务列表=" + uuid2, new Object[0]);
                    if (uuid2.equals(BleProfile.UI_SERVICE_UUID)) {
                        BluetoothService.this.isFindUiService = true;
                    }
                    if (uuid2.equals(BleProfile.BATTERY_SERVICE_UUID)) {
                        BluetoothService.this.isFindVPProtocolService = true;
                        for (BluetoothGattCharacteristic bluetoothGattCharacteristic : bluetoothGattService.getCharacteristics()) {
                            if (bluetoothGattCharacteristic.getUuid().equals(BleProfile.BATTERY_READ_UUID)) {
                                BluetoothService.this.vpProtocolBleNotification = bluetoothGattCharacteristic;
                            }
                        }
                    }
                    if (uuid2.equals(BleProfile.JL_BLE_UUID_SERVICE)) {
                        BluetoothService.isFindJLService = true;
                        for (BluetoothGattCharacteristic bluetoothGattCharacteristic2 : bluetoothGattService.getCharacteristics()) {
                            if (bluetoothGattCharacteristic2.getUuid().equals(BleProfile.JL_BLE_UUID_WRITE)) {
                                BluetoothService.this.jlBleWrite = bluetoothGattCharacteristic2;
                                Logger.t(BluetoothService.TAG_JL).e("杰理表盘服务查找---> [写] uuid = " + BleProfile.JL_BLE_UUID_WRITE.toString(), new Object[0]);
                            }
                            if (bluetoothGattCharacteristic2.getUuid().equals(BleProfile.JL_BLE_UUID_NOTIFICATION)) {
                                Logger.t(BluetoothService.TAG_JL).e("杰理表盘服务查找---> [通知] uuid = " + BleProfile.JL_BLE_UUID_NOTIFICATION.toString(), new Object[0]);
                                BluetoothService.this.jlBleNotification = bluetoothGattCharacteristic2;
                            }
                        }
                    }
                    if (uuid2.equals(BleProfile.ZK_OTA_SERVICE_UUID)) {
                        Logger.t(BluetoothService.TAG_BLUETRUM).v("连接成功并发现中科OTA服务....", new Object[0]);
                        BluetoothService.this.isFindBluetrumService = true;
                    }
                }
                if (BluetoothService.isFindJLService && BluetoothService.this.jlBleNotification != null) {
                    RcspAuthManager.getInstance().setAuthPass(false);
                    Logger.t(BluetoothService.TAG_JLOTA).e("杰理表盘服务找到！！！！！！！！！！！！！ = " + BleProfile.JL_BLE_UUID_NOTIFICATION.toString(), new Object[0]);
                    if (JLOTAActivity.isOTAUpgrading || JLOTATestActivity.isOTAUpgrading) {
                        Logger.t(BluetoothService.TAG_JLOTA).e("杰理表盘服务找到,------>去打开杰理通知", new Object[0]);
                        BluetoothService bluetoothService = BluetoothService.this;
                        bluetoothService.openNotification(bluetoothService.jlBleNotification, NotificationType.J_L);
                    }
                }
                SpUtil.saveInt(BluetoothService.this.mContext, SputilVari.CAN_SEND_MAX_LENGTH, 20);
                if (BluetoothService.this.isFindVPProtocolService) {
                    BluetoothService.this.sendBleConnectAction("发现VP服务");
                    HBLogger.clearHBLogger(false);
                    BluetoothService.this.tryCount = 0;
                    String str = "服务->有服务并找到相应服务，是否要自动连接=" + BluetoothService.this.isNeedAutoConnect;
                    Logger.t(BluetoothService.TAG).e(str, new Object[0]);
                    Logger.t(BluetoothService.TAG_JLOTA).e(str, new Object[0]);
                    HBLogger.bleConnectLog(str);
                    if (BluetoothService.this.isNeedAutoConnect) {
                        Logger.t(BluetoothService.TAG).e("服务->自动连接", new Object[0]);
                        Logger.t(BluetoothService.PWD_ACTION).e("服务->自动连接", new Object[0]);
                        Context context = BluetoothService.this.mContext;
                        String str2 = BluetoothService.DEFAULT_PWD;
                        String string = SpUtil.getString(context, SputilVari.BLE_LAST_CONNECT_PASSWORD, BluetoothService.DEFAULT_PWD);
                        if (!TextUtils.isEmpty(string)) {
                            str2 = string;
                        }
                        HBLogger.bleConnectLog("-----------connect success-----------");
                        HBLogger.bleConnectLog("*****自动发送密码验证*****");
                        Logger.t(BluetoothService.TAG_JLOTA).e(str, new Object[0]);
                        BluetoothService.this.wantCheckPassword(str2);
                        return;
                    }
                    Logger.t(BluetoothService.TAG).e("服务->手动连接", new Object[0]);
                    Logger.t(BluetoothService.PWD_ACTION).e("服务->手动连接", new Object[0]);
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.CONNECTING_DEVICE_AND_FINDER_SERVER);
                    HBLogger.bleConnectLog("扫描界面弹窗验证");
                    HBLogger.bleConnectLog("-----------connect success-----------");
                    return;
                }
                BluetoothService.this.sendBleConnectAction("没有发现VP服务，断开");
                HBLogger.bleConnectLog("服务->有服务并没有找到相应服务");
                if (!BluetoothService.this.isStartScanLooper) {
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_SERVICE);
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.CONNECT_SUCCESS_HAVE_SERVICE_BUT_UNEXIT);
                }
                BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_HAVE_SERVICE_BUT_ABSENCE);
                return;
            }
            HBLogger.bleConnectLog("服务->发现服务失败");
            BluetoothService.this.sendBleConnectAction("连接成功，发现服务失败，断开");
            BluetoothService.this.bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_SERVICE_DISCOVER_FAILED);
            Logger.t(BluetoothService.TAG).e("服务->发现服务失败", new Object[0]);
            BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_DISCOVERY_SERVICE_GATT_FAILED);
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onDescriptorWrite(final BluetoothGatt bluetoothGatt, BluetoothGattDescriptor bluetoothGattDescriptor, int i) throws InterruptedException, NoSuchMethodException, SecurityException {
            super.onDescriptorWrite(bluetoothGatt, bluetoothGattDescriptor, i);
            UUID uuid = bluetoothGattDescriptor.getCharacteristic().getUuid();
            final byte[] value = bluetoothGattDescriptor.getCharacteristic().getValue();
            Logger.t(BluetoothService.TAG).i("sbluetooth 描述收到 status=" + i + ",uuid=" + uuid.toString(), new Object[0]);
            if (value != null) {
                Logger.t(BluetoothService.TAG).i("sbluetooth 描述收到 cmd=" + ConvertHelper.byte2HexForShow(value), new Object[0]);
            } else {
                Logger.t(BluetoothService.TAG).i("sbluetooth 描述收到 cmd=null", new Object[0]);
            }
            if (i != 0) {
                Logger.t(BluetoothService.TAG).e("onDescriptorWrite 监听服务失败", new Object[0]);
                HBLogger.bleConnectLog("onDescriptorWrite 监听服务失败:" + i);
                BluetoothService.this.getMessage(3);
                BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_FAIL_TO_WRITE_DES);
                return;
            }
            if (uuid.equals(BleProfile.BATTERY_READ_UUID)) {
                HBLogger.bleConnectLog("-VP协议服务通知打开成功-");
                Logger.t(BluetoothService.PWD_ACTION).e("onDescriptorWrite 监听Battery服务成功 isFindUiService = " + BluetoothService.this.isFindUiService + " isFindJLService = " + BluetoothService.isFindJLService, new Object[0]);
                if (BluetoothService.this.isFindUiService && BluetoothService.isFindJLService) {
                    HBLogger.bleConnectLog("-VP协议服务通知打开成功- 开启UI服务");
                    BluetoothService.this.bleNotify(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, null, "监听ui升级服务");
                    BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.3
                        @Override // java.lang.Runnable
                        public void run() {
                            HBLogger.bleConnectLog("-VP协议服务通知打开成功- 开启UI服务√ --> 去开启杰理大数据通知（已延迟1s）");
                            Logger.t(BluetoothService.TAG_JLOTA).e("onDescriptorWrite ----->去打开杰理通知", new Object[0]);
                            BluetoothService.this.openNotification(BluetoothService.this.jlBleNotification, NotificationType.J_L);
                        }
                    }, 1000L);
                    BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.4
                        @Override // java.lang.Runnable
                        public void run() throws InterruptedException {
                            HBLogger.bleConnectLog("-VP协议服务通知打开成功- 开启UI服务√ --> 开启杰理大数据通知（已延迟1s）√ ---> 去密码校验（已延迟4s）");
                            Logger.t(BluetoothService.PWD_ACTION).e("有UI服务和杰理服务 发送密码 4秒后--value = " + ConvertHelper.byte2HexForShow(value), new Object[0]);
                            BluetoothService.this.sendPasswordCheckCmd();
                        }
                    }, 4000L);
                    return;
                }
                if (BluetoothService.this.isFindUiService && BluetoothService.this.isFindBluetrumService) {
                    BluetoothService.this.bleNotify(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, null, "监听ui升级服务");
                    BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.5
                        @Override // java.lang.Runnable
                        public void run() {
                            Logger.t(BluetoothService.TAG_JLOTA).e("onDescriptorWrite ----->去打开中科通知", new Object[0]);
                            BluetrumBleManager.getInstance().init(BluetoothService.this.mContext, bluetoothGatt);
                        }
                    }, 1000L);
                    BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.6
                        @Override // java.lang.Runnable
                        public void run() throws InterruptedException {
                            Logger.t(BluetoothService.PWD_ACTION).e("有UI服务和杰理服务 发送密码 4秒后--value = " + ConvertHelper.byte2HexForShow(value), new Object[0]);
                            BluetoothService.this.sendPasswordCheckCmd();
                        }
                    }, 4000L);
                    return;
                } else {
                    if (BluetoothService.this.isFindUiService) {
                        BluetoothService.this.bleNotify(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, null, "监听ui升级服务");
                        BluetoothService.this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.7
                            @Override // java.lang.Runnable
                            public void run() throws InterruptedException {
                                Logger.t(BluetoothService.PWD_ACTION).e("只有UI服务 发送密码  = " + ConvertHelper.byte2HexForShow(value), new Object[0]);
                                BluetoothService.this.sendPasswordCheckCmd();
                            }
                        }, 4000L);
                        return;
                    }
                    Logger.t(BluetoothService.PWD_ACTION).e("没有UI服务 发送密码  = " + ConvertHelper.byte2HexForShow(value), new Object[0]);
                    BluetoothService.this.sendPasswordCheckCmd();
                    return;
                }
            }
            if (uuid.equals(BleProfile.UI_READ_UUID)) {
                HBLogger.bleConnectLog("-UI升级服务通知打开成功-");
                Logger.t(BluetoothService.TAG).i("sbluetooth onDescriptorWrite  监听ui升级服务成功", new Object[0]);
                if (!BluetoothService.this.isFindUiService || BluetoothService.isFindJLService || BluetoothService.this.isFindBluetrumService) {
                    return;
                }
                SpUtil.saveInt(BluetoothService.this.mContext, SputilVari.CAN_SEND_MAX_LENGTH, 20);
                if (Build.VERSION.SDK_INT >= 21) {
                    Logger.t(BluetoothService.TAG_JL).d("申请MTU值：-------------------UI_READ_UUID（requestMtu） 247");
                    bluetoothGatt.requestMtu(247);
                    return;
                }
                return;
            }
            if (uuid.equals(BleProfile.BP_READ_UUID)) {
                if (!TextUtils.equals(BluetoothService.this.bpOption, BPHandler.READ_BP_NORMAL) && !TextUtils.equals(BluetoothService.this.bpOption, BPHandler.READ_BP_NORMAL_UNNOTIFY)) {
                    if (TextUtils.equals(BluetoothService.this.bpOption, BPHandler.READ_BP_PRIVATE) || TextUtils.equals(BluetoothService.this.bpOption, BPHandler.READ_BP_PRIVATE_UNNOTIFY)) {
                        BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, BleProfile.READ_BP_PRIVATE);
                        Logger.t(BluetoothService.TAG).i("BP监听ADC=" + BluetoothService.this.bpOption, new Object[0]);
                    }
                } else {
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, BleProfile.READ_BP_NORMAL);
                    Logger.t(BluetoothService.TAG).i("BP监听ADC=" + BluetoothService.this.bpOption, new Object[0]);
                }
                if (TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_ECG_NOTIFY)) {
                    Logger.t(BluetoothService.TAG).i("ECG_SERVER ecg cmd=" + ConvertHelper.byte2HexForShow(BleProfile.READ_ECG_NOTIFY) + ",ADC带监听=" + BluetoothService.this.bpOption, new Object[0]);
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, BleProfile.READ_ECG_NOTIFY);
                } else if (TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_ECG_UNNOTIFY)) {
                    Logger.t(BluetoothService.TAG).i("ECG_SERVER ecg cmd=" + ConvertHelper.byte2HexForShow(BleProfile.READ_ECG_UNNOTIFY) + ",ADC不带监听=" + BluetoothService.this.bpOption, new Object[0]);
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, BleProfile.READ_ECG_UNNOTIFY);
                }
                if (TextUtils.equals(BluetoothService.this.bpOption, ECGMultiLeadDetectHandler.OPT_START_DETECT)) {
                    Logger.t(BluetoothService.TAG).i("多导开始检测 cmd=" + ConvertHelper.byte2HexForShow(value) + ",ADC带监听=" + BluetoothService.this.bpOption, new Object[0]);
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, value);
                }
                if (TextUtils.equals(BluetoothService.this.bpOption, ECGMultiLeadDetectHandler.OPT_STOP_DETECT)) {
                    Logger.t(BluetoothService.TAG).i("多导停止检测 cmd=" + ConvertHelper.byte2HexForShow(value) + ",ADC带监听=" + BluetoothService.this.bpOption, new Object[0]);
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, value);
                }
                if (!TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_FTT_START_NOTIFY)) {
                    if (TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_FTT_START_UNNOTIFY)) {
                        BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, BleProfile.READ_FTT_UNNOTIFY);
                        return;
                    }
                    return;
                }
                BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, BleProfile.READ_FTT_NOTIFY);
                return;
            }
            if (uuid.equals(BleProfile.JL_BLE_UUID_NOTIFICATION)) {
                Logger.t(BluetoothService.TAG_JL).e("杰理 notify 打开成功", new Object[0]);
                HBLogger.bleConnectLog("-杰理大数据传输服务通知打开成功-");
                BluetoothService.isJLNotificationOpen = true;
                SpUtil.saveInt(BluetoothService.this.mContext, SputilVari.CAN_SEND_MAX_LENGTH, 20);
                if (Build.VERSION.SDK_INT >= 21) {
                    Logger.t(BluetoothService.TAG_JLOTA).d("申请MTU值：-------------------JL_BLE_UUID_NOTIFICATION（requestMtu） 247");
                    bluetoothGatt.requestMtu(247);
                    return;
                }
                return;
            }
            if (uuid.equals(BleProfile.ZK_OTA_DATA_IN_UUID)) {
                BluetoothService.isOpenBluetrumService = true;
                SpUtil.saveInt(BluetoothService.this.mContext, SputilVari.CAN_SEND_MAX_LENGTH, 20);
                Logger.t(BluetoothService.TAG_BLUETRUM).d("中科服务打开成功：-------------------（requestMtu） 517");
                if (Build.VERSION.SDK_INT >= 21) {
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.8
                        @Override // java.lang.Runnable
                        public void run() {
                            Logger.t(BluetoothService.TAG_BLUETRUM).d("申请MTU值：-------------------ZK_OTA_DATA_IN_UUID（requestMtu） 517");
                            bluetoothGatt.requestMtu(247);
                        }
                    }, 1000L);
                }
            }
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onReadRemoteRssi(BluetoothGatt bluetoothGatt, int i, int i2) {
            super.onReadRemoteRssi(bluetoothGatt, i, i2);
            if (i2 == 0) {
                Logger.t(BluetoothService.TAG).e("onReadRemoteRssi rssi:" + i, new Object[0]);
                Intent intent = new Intent(BleBroadCast.GET_RSSI_VALUE);
                intent.putExtra("rssi", i);
                LocalBroadcastManager.getInstance(BluetoothService.this.mContext).sendBroadcast(intent);
            }
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onCharacteristicChanged(BluetoothGatt bluetoothGatt, BluetoothGattCharacteristic bluetoothGattCharacteristic) throws IllegalStateException, InterruptedException, NoSuchMethodException, SecurityException {
            super.onCharacteristicChanged(bluetoothGatt, bluetoothGattCharacteristic);
            BluetrumBleManager.getInstance().onCharacteristicChanged(bluetoothGattCharacteristic);
            WatchFaceTransferManager.getInstance().handlerCharacteristicChanged(bluetoothGatt, bluetoothGattCharacteristic);
            WatchRecordingManager.getInstance().handlerRecordingData(bluetoothGattCharacteristic);
            UUID uuid = bluetoothGattCharacteristic.getUuid();
            int i = 2;
            boolean z = true;
            if (uuid.equals(BleProfile.BATTERY_READ_UUID)) {
                final byte[] value = bluetoothGattCharacteristic.getValue();
                BleWriteAndResponseManager.getInstance().handlerData(value, uuid);
                final String action = BleProfileUtil.getAction(uuid, value);
                if (action.equals(BleProfile.BATTERY_BIG_DATA_TARN) && HBandApplication.isRecodeDialTransfer) {
                    HBLogger.dailTransferLog("Receiver:#收到大数据相关#--->" + ConvertHelper.byte2HexForShow(value));
                }
                String str = "watch::::::>" + action + "->" + ConvertHelper.byte2HexForShow(value);
                if (BluetoothService.this.isShowLog(action, value)) {
                    Logger.t(BluetoothService.TAG).w(str, new Object[0]);
                }
                HBLogger.bleChangeLog(str);
                if (action.equals(BleProfile.BATTERY_PASSWROD_CHECK)) {
                    Logger.t(BluetoothService.TAG + "动画").d(PwdHandler.getReturnData(BluetoothService.this.mContext, value) + "--BATTERY_PASSWROD_CHECK + >" + ConvertHelper.byte2HexForShow(value));
                    SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.BLE_PWD_CALLBACK, true);
                    HBLogger.bleConnectLog("*****密码校验通过*****");
                    BluetoothService.this.optionDevicePwd(value);
                } else if (action.equals(BleProfile.DEVICE_FUNCTION)) {
                    DeviceFunctionHandler.parseFunctionData(BluetoothService.this.mContext, value);
                } else if (action.equals(BleProfile.DEVICE_MSG_OPRATE)) {
                    DeviceFunctionHandler.getDeviceMsgSupportData(BluetoothService.this.mContext, value);
                    BluetoothService.this.bleSendBroadcast(action, value);
                } else if (action.equals(BleProfile.PERSON_WATCH_SETTING_OPRATE)) {
                    Logger.t(BluetoothService.TAG).e("收到B8功能开关：" + ConvertHelper.byte2HexForShow(value), new Object[0]);
                    if (value[1] == 2 && value[19] == 0) {
                        VeepooA7B8CmdManager.getInstance().addB8CMD(value);
                        BluetoothService.this.judageTheSame(value, action);
                    } else if (value[1] != 2 || value[19] != 1) {
                        DeviceFunctionHandler.getDevicePersonWatchSetting(BluetoothService.this.mContext, value);
                        BluetoothService.this.bleSendBroadcast(action, value);
                    } else {
                        VeepooA7B8CmdManager.getInstance().addB8CMD(value);
                        BluetoothService.this.judageTheSame2(value, action);
                        BluetoothService.this.bleSendBroadcast(action, value);
                    }
                } else if (action.equals(BleProfile.GPS_DATA_OPRATE)) {
                    BluetoothService.this.mGpsDataHandler.handleByte(value);
                } else if (action.equals(BleProfile.GPS_TIMEZONE_OPERATE)) {
                    AGPSManager.INSTANCE.getInstance().handlerGPS(value);
                } else if (action.equals(BleProfile.CONTACT_OPRATE)) {
                    BluetoothService.this.mContactHandler.handler(value);
                } else if (action.equals(BleProfile.PHONE_MESSAGE)) {
                    HBLogger.bleWriteLog("收到设备发过来的来电通知....." + ConvertHelper.byte2HexForShow(value));
                    if (value[1] == 2) {
                        while (true) {
                            if (i > 19) {
                                break;
                            }
                            if (value[i] != 0) {
                                z = false;
                                break;
                            }
                            i++;
                        }
                        if (z) {
                            HBLogger.bleWriteLog("收到设备发过来的来电通知.....拒接来电操作");
                            PhoneCallUtil.rejectCall(BluetoothService.this.mContext);
                            BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, value);
                        }
                    } else if (value[1] == 3) {
                        HBLogger.bleWriteLog("来电静音.....");
                        Logger.t(BluetoothService.TAG).e("来电静音动作", new Object[0]);
                        PhoneCallUtil.phoneSilence(BluetoothService.this.mContext);
                    } else if (value[1] == 4) {
                        Logger.t(BluetoothService.TAG).e("来电接听", new Object[0]);
                        BluetoothService.this.answerRingingCall();
                    }
                } else if (action.equals(BleProfile.BLUETOOTH3_OPRATE)) {
                    SpUtil.saveBoolean(BluetoothService.this.mContext, SputilVari.IS_GET_BLUETOOTH3_CMD, true);
                    BluetoothService.this.bleSendBroadcast(action, value);
                } else if (action.equals(BleProfile.TAKE_PHOTO_OPRATE)) {
                    BluetoothService.this.toCameraActivity(value);
                    BluetoothService.this.bleSendBroadcast(action, value);
                } else if (action.equals(BleProfile.BATTERY_BIG_DATA_TARN)) {
                    if (value[2] == -95) {
                        AGPSManager.INSTANCE.getInstance().handlerCmd(value);
                    } else if (value[2] == 4) {
                        VideoDialHandler.getInstance().handlerData(value);
                    } else if (value[1] == 4) {
                        PhotoAlbumHandler.INSTANCE.getInstance().handlerCmd(value);
                    } else {
                        if (value.length >= 4 && value[1] == 1 && value[3] == 4) {
                            BluetoothService.this.destroyBigSendCmdTimer();
                        } else {
                            BluetoothService.this.bleReadManager.manage(action, value);
                        }
                        BluetoothService.this.bleSendBroadcast(action, value);
                    }
                } else if (action.equals(BleProfile.FIND_PHONE_BY_WATCH_OPERATE)) {
                    if (value[1] == 0) {
                        Logger.t(BluetoothService.TAG).e("设备查找手机", new Object[0]);
                        if (BluetoothService.this.isRing) {
                            return;
                        }
                        BluetoothService.this.phoneRing();
                        BluetoothService.this.shackPhone();
                    } else {
                        BluetoothService.this.bleSendBroadcast(BleProfile.FIND_PHONE_BY_WATCH_OPERATE, value);
                    }
                } else if (action.equals(BleProfile.BATTERY_AUTO_CALLBACK)) {
                    BluetoothService.this.autoCallbackHandler.handler(BluetoothService.this.mContext, value);
                } else if (action.equals(BleProfile.SPORT_MODEL_CRC_OPRATE) && value[1] == 2) {
                    byte[] bArr = new byte[20];
                    bArr[0] = BleProfile.HEAD_SPORT_MODEL_CRC;
                    bArr[1] = 1;
                    try {
                        Thread.sleep(500L);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                    BluetoothService.this.bleSendBroadcast(action, value);
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, bArr);
                } else if (action.equals(BleProfile.SOS_OPRATE)) {
                    Logger.t(BluetoothService.TAG).e("收到sos --------------------> ", new Object[0]);
                    BluetoothService.this.postSOSAction();
                } else if (!action.equals(BleProfile.RR_INTERVAL_OPRATE)) {
                    if (action.equals(BleProfile.WORLD_CLOCK_OPERATE)) {
                        WorldClockHandler.INSTANCE.getInstance().handler(value);
                    } else {
                        BluetoothService.this.bleReadManager.manage(action, value);
                        if (!action.equals(BleProfile.MUSIC_OPRATE)) {
                            BluetoothService.this.bleSendBroadcast(action, value);
                        } else {
                            boolean zIsServiceRunning = HBandApplication.isServiceRunning(HBandApplication.instance, MusicOpraterService.class.getName());
                            Logger.t(BluetoothService.TAG).e("收到音乐控制消息 -------------------->  " + MusicOpraterService.class.getName() + " isRunning = " + zIsServiceRunning, new Object[0]);
                            HBLogger.bleWriteLog("收到音乐控制消息 ---->  " + MusicOpraterService.class.getName() + " isRunning = " + zIsServiceRunning);
                            if (!zIsServiceRunning) {
                                Logger.t(BluetoothService.TAG).e("收到音乐消息 --------------------> 音乐服务关闭 去打开*********** " + MusicOpraterService.class.getName(), new Object[0]);
                                BluetoothService.this.startService(new Intent(HBandApplication.instance, (Class<?>) MusicOpraterService.class));
                                HBandApplication.instance.uiHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.9
                                    @Override // java.lang.Runnable
                                    public void run() {
                                        BluetoothService.this.bleSendBroadcast(action, value);
                                    }
                                }, 1000L);
                            } else {
                                BluetoothService.this.bleSendBroadcast(action, value);
                            }
                        }
                        BluetoothService.this.handleWatchSetting(action, value);
                    }
                }
            } else if (uuid.equals(BleProfile.BP_READ_UUID)) {
                BluetoothService.this.bleSendBroadcast(BleBroadCast.BP_ADC, bluetoothGattCharacteristic.getValue());
            } else if (uuid.equals(BleProfile.UI_READ_UUID)) {
                byte[] value2 = bluetoothGattCharacteristic.getValue();
                if (WatchFaceTransferManager.getInstance().isWatchFaceTransmitting()) {
                    return;
                }
                HBLogger.bleChangeLog("------------> 收到UI通道指令：" + ConvertHelper.byte2HexForShow(value2));
                Logger.t(BluetoothService.TAG).e("------------> 收到UI通道指令：" + ConvertHelper.byte2HexForShow(value2), new Object[0]);
                if (HBandApplication.isRecodeDialTransfer) {
                    HBLogger.dailTransferLog("Get:---------------->" + ConvertHelper.byte2HexForShow(value2));
                }
                Logger.t(BluetoothService.TAG).e("ui,changed：" + ConvertHelper.byte2HexForShow(value2), new Object[0]);
                if (value2.length >= 1 && value2[0] == 5) {
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.UPDATE_UI_CALLBACK_05);
                    BluetoothService.this.pasueSend = false;
                }
                if (value2.length > 2 && value2[0] == 1) {
                    BluetoothService.this.hasUIWiped = true;
                    if (value2[1] == 3) {
                        if (HBandApplication.isRecodeDialTransfer) {
                            HBLogger.dailTransferLog("========================>设备通知手机UI擦除完成<========================");
                        }
                        BluetoothService.this.bleSendBroadcast(BleBroadCast.UPDATE_UI_CALLBACK_01);
                        if (AGPSSettingActivity.isShow) {
                            Logger.t(BluetoothService.TAG).e("UPDATE_UI_CALLBACK_01-星历Show return", new Object[0]);
                            return;
                        }
                        BluetoothService.this.destroyBigSendCmdTimer();
                        Logger.t(BluetoothService.TAG).e("UI擦除结束了 mIsNeedFlip=" + BluetoothService.this.mIsNeedFlip, new Object[0]);
                        BluetoothService.this.mHuitopUIUpdateHandler = new HuitopUIUpdateHandler(BluetoothService.this.mContext, BluetoothService.this.mFileUiPath, "", SpUtil.getInt(BluetoothService.this.mContext, SputilVari.CAN_SEND_MAX_LENGTH, 20), BluetoothService.this.mIsBinFile, BluetoothService.this.mWatchUIType, BluetoothService.this.mIsNeedFlip);
                        BluetoothService.all_block = BluetoothService.this.mHuitopUIUpdateHandler.getSumBlockCount();
                        BluetoothService.current_block = 1;
                        BluetoothService.this.isUITransferNeedWait = false;
                        BluetoothService.this.sendBlockContentTimerHuitop();
                    } else if (value2[1] == 2) {
                        Logger.t(BluetoothService.TAG).e("UI擦除正在进行中", new Object[0]);
                        if (HBandApplication.isRecodeDialTransfer) {
                            HBLogger.dailTransferLog("========================>设备通知手机【UI擦除正在进行中】<========================");
                        }
                    } else if (value2[1] == 1) {
                        Logger.t(BluetoothService.TAG).e("UI擦除开始", new Object[0]);
                        if (HBandApplication.isRecodeDialTransfer) {
                            HBLogger.dailTransferLog("========================>设备通知手机【UI擦除开始】<========================");
                        }
                        BluetoothService.this.createBigSendCmdTimer();
                    } else if (value2[1] == 0) {
                        Logger.t(BluetoothService.TAG).e("UI擦除address不是4k对齐", new Object[0]);
                        if (HBandApplication.isRecodeDialTransfer) {
                            HBLogger.dailTransferLog("========================>设备通知手机【UI擦除address不是4k对齐】<========================");
                        }
                    }
                }
                if (value2.length >= 1 && value2[0] == 2) {
                    if (HBandApplication.isRecodeDialTransfer) {
                        HBLogger.dailTransferLog("========================>设备通知手机【设备收到发送命令完成，开始app发送crc到设备进行校验】<========================");
                    }
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.UPDATE_UI_CALLBACK_02);
                }
                if (value2.length >= 1 && value2[0] == 3) {
                    if (BluetoothService.this.hasUIWiped) {
                        BluetoothService.this.hasUIWiped = false;
                        int i2 = (value2[1] & 255) | ((value2[2] << 8) & MotionEventCompat.ACTION_POINTER_INDEX_MASK);
                        Logger.t(BluetoothService.TAG).e("crc校验,back_crc=" + i2, new Object[0]);
                        if (HBandApplication.isRecodeDialTransfer) {
                            HBLogger.dailTransferLog("========================>设备通知手机【设备收到crc，发送crc到设备进行校验】<========================：" + i2);
                        }
                        BluetoothService.this.bleSendBroadcast(BleBroadCast.UPDATE_UI_CALLBACK_03, value2);
                        if (value2[3] == -95) {
                            int iTwoByteToInt = ConvertHelper.twoByteToInt(value2[5], value2[4]);
                            Intent intent = new Intent(BleBroadCast.AGPS_VALID_MINUTE);
                            intent.putExtra("agpsValidMinute", iTwoByteToInt);
                            LocalBroadcastManager.getInstance(BluetoothService.this.mContext).sendBroadcast(intent);
                        }
                    } else {
                        if (HBandApplication.isRecodeDialTransfer) {
                            HBLogger.dailTransferLog("========================>UI擦除动作未执行，该升级为WatchFaceTransferManager控制，退出该动作<========================");
                            return;
                        }
                        return;
                    }
                }
            }
            if (uuid.equals(BleProfile.JL_BLE_UUID_NOTIFICATION)) {
                Logger.t(BluetoothService.TAG_JL).e("杰理OTA数据透传--->是否是强升模式 = " + JLOTAManager.getInstance().isDeviceInMandatoryUpdate + " value = " + ConvertHelper.byte2HexForShow(bluetoothGattCharacteristic.getValue()), new Object[0]);
                Logger.t(BluetoothService.TAG_JL).e("【杰理】-收到杰理数据- " + Thread.currentThread() + " - " + ConvertHelper.byte2Hex(bluetoothGattCharacteristic.getValue()), new Object[0]);
                JLOTAManager.getInstance().handlerReceiveDeviceData(bluetoothGatt.getDevice(), bluetoothGattCharacteristic.getValue());
                Logger.t(BluetoothService.TAG_JL).e("杰理表盘数据透传---> value = " + ConvertHelper.byte2HexForShow(bluetoothGattCharacteristic.getValue()), new Object[0]);
                WatchManager.getInstance().handReceiveDeviceData(bluetoothGatt.getDevice(), bluetoothGattCharacteristic.getValue());
            }
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onMtuChanged(BluetoothGatt bluetoothGatt, final int i, int i2) {
            super.onMtuChanged(bluetoothGatt, i, i2);
            if (Build.VERSION.SDK_INT >= 34 && i > 247) {
                BluetoothService.this.mBleMtu = 180;
            } else if (i > 180) {
                BluetoothService.this.mBleMtu = i - 30;
                if (BluetoothService.this.mBleMtu > 180) {
                    BluetoothService.this.mBleMtu = 180;
                }
            } else {
                BluetoothService.this.mBleMtu = i - 3;
            }
            if (AppSPUtil.isShowMtu()) {
                HBThreadPools.runOnUIThread(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.7.10
                    @Override // java.lang.Runnable
                    public void run() {
                        Toast.makeText(BluetoothService.this.mContext, "MTU协商成功：" + i + ", app使用的mtu = " + BluetoothService.this.mBleMtu, 0).show();
                    }
                });
            }
            HBLogger.bleConnectLog("设备协商回复的 mtu = " + i + " ,矫正后的实际 mtu = " + BluetoothService.this.mBleMtu + " , status = " + i2 + " address = " + bluetoothGatt.getDevice().getAddress());
            SpUtil.saveInt(BluetoothService.this.mContext, SputilVari.CAN_SEND_MAX_LENGTH, BluetoothService.this.mBleMtu);
            Printer printerT = Logger.t(BluetoothService.TAG);
            StringBuilder sb = new StringBuilder();
            sb.append("mtu--->");
            sb.append(i);
            sb.append(",数据包最大长度:");
            sb.append(BluetoothService.this.mBleMtu);
            printerT.i(sb.toString(), new Object[0]);
            HBLogger.bleConnectLog("MTU协商成功 mtu = " + BluetoothService.this.mBleMtu);
            ToastUtils.showDebug("申请MTU成功：mtu = " + i + " mBleMtu = " + BluetoothService.this.mBleMtu);
            if (BluetoothService.isFindJLService) {
                Logger.t(BluetoothService.TAG_JLOTA).i("杰理OTA MTU值透传，mtu--->" + i + ",数据包最大长度:" + BluetoothService.this.mBleMtu, new Object[0]);
                JLOTAManager.getInstance().handlerMtuChanged(bluetoothGatt, i, i2);
            }
            boolean zIsInOTA = BluetoothService.isInOTA();
            if (JLOTAActivity.isShow || JLOTATestActivity.isShow || JLOTAActivity.isOTAUpgrading) {
                Logger.t(BluetoothService.TAG_JLOTA).i("申请MTU值成功后且还在升级流程中------OTAManager init 是否是强升模式 " + JLOTAManager.getInstance().isDeviceInMandatoryUpdate, new Object[0]);
                Logger.t(BluetoothService.TAG_JLOTA).i("申请MTU值成功后且还在升级流程中------JLOTAActivity.isShow =  " + JLOTAActivity.isShow + ", isJLOTAUpgrading = " + zIsInOTA, new Object[0]);
                if (BluetoothService.isFindJLService) {
                    JLOTAManager.getInstance().init(bluetoothGatt);
                }
            }
            if (BluetoothService.this.isFindBluetrumService) {
                BluetrumBleManager.getInstance().onMtuChanged(BluetoothService.this.mBleMtu);
            }
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onCharacteristicWrite(BluetoothGatt bluetoothGatt, BluetoothGattCharacteristic bluetoothGattCharacteristic, int i) throws InterruptedException, NoSuchMethodException, SecurityException {
            super.onCharacteristicWrite(bluetoothGatt, bluetoothGattCharacteristic, i);
            if (BluetoothService.this.isShowLog("", bluetoothGattCharacteristic.getValue())) {
                Logger.t(BluetoothService.TAG).i("onCharacteristicWrite:" + bluetoothGattCharacteristic.getUuid() + " value = " + ConvertHelper.byte2HexForShow(bluetoothGattCharacteristic.getValue()), new Object[0]);
            }
            BluetrumBleManager.getInstance().onCharacteristicWrite(bluetoothGattCharacteristic, i);
            AGPSManager.INSTANCE.getInstance().handlerOnCharacteristicWrite(bluetoothGatt, bluetoothGattCharacteristic, i);
            WatchFaceTransferManager.getInstance().handleCharacteristicWrite(bluetoothGattCharacteristic, i);
            AIPreviewSendManger.getInstance().handleCharacteristicWrite(bluetoothGattCharacteristic, i);
            if (bluetoothGattCharacteristic.getUuid().equals(BleProfile.UI_CONFIG_UUID) && Arrays.equals(bluetoothGattCharacteristic.getValue(), BluetoothService.this.lastCmd)) {
                if (BluetoothService.this.pasueSend) {
                    Logger.t(BluetoothService.TAG).i("暂停发送", new Object[0]);
                    return;
                }
                if (BluetoothService.this.isUITransferNeedWait) {
                    Logger.t(BluetoothService.TAG).e("UI数据传输需要暂停: 直接不处理", new Object[0]);
                    return;
                }
                BluetoothService.this.updateUIprogress();
                Logger.t(BluetoothService.TAG).i("sendBlockContentTimerHuitop:" + BluetoothService.current_block + WatchConstant.FAT_FS_ROOT + BluetoothService.all_block + SkinListUtils.DEFAULT_JOIN_SEPARATOR + ((BluetoothService.current_block * 100) / BluetoothService.all_block) + "%", new Object[0]);
                if (bluetoothGatt == null || Build.VERSION.SDK_INT >= 21) {
                    Printer printerT = Logger.t(BluetoothService.TAG);
                    StringBuilder sb = new StringBuilder();
                    sb.append(BluetoothService.current_block);
                    sb.append(",status:");
                    sb.append(i == 0);
                    printerT.i(sb.toString(), new Object[0]);
                    try {
                        Thread.sleep(10L);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                } else {
                    try {
                        Thread.sleep(30L);
                    } catch (InterruptedException e2) {
                        e2.printStackTrace();
                    }
                }
                BluetoothService.this.sendBlockContentTimerHuitop();
            }
            UUID uuid = bluetoothGattCharacteristic.getUuid();
            BluetoothGattService service = bluetoothGattCharacteristic.getService();
            UUID uuid2 = service != null ? service.getUuid() : null;
            if (uuid2.equals(BleProfile.JL_BLE_UUID_SERVICE)) {
                BluetoothService.this.wakeupSendThread(bluetoothGatt, uuid2, uuid, i, bluetoothGattCharacteristic.getValue());
            }
        }

        @Override // android.bluetooth.BluetoothGattCallback
        public void onReliableWriteCompleted(BluetoothGatt bluetoothGatt, int i) {
            super.onReliableWriteCompleted(bluetoothGatt, i);
        }
    };
    private long receiveSOSTime = -1;
    boolean isRing = false;
    private byte[] currentSendCMD = null;
    private UUID preSendServiceUUID = null;
    private UUID preSendConfigUUID = null;
    private boolean isUserLEConnectType = true;
    int tryCount = 0;
    private boolean isManualRequestMtu = false;
    private final BroadcastReceiver bleGetBroadcast = new BroadcastReceiver() { // from class: com.veepoo.hband.ble.BluetoothService.12
        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) throws InterruptedException, NoSuchMethodException, SecurityException {
            String action;
            String stringExtra;
            action = intent.getAction();
            stringExtra = intent.getStringExtra(BleIntentPut.BLE_OPTION);
            if (!TextUtils.isEmpty(stringExtra)) {
                if (!stringExtra.equals(SportHandler.STEP_ACTION)) {
                    Logger.t(BluetoothService.TAG).i("bleService 收到的广播操作-" + stringExtra, new Object[0]);
                }
                if (stringExtra.contains(SportHandler.STEP_ACTION)) {
                    BluetoothService.this.jugdeNotifyListenerService();
                }
            }
            BluetoothService.this.sendInfo = "";
            action.hashCode();
            switch (action) {
                case "AI_PREVIEW_DATA_TRANSFER":
                    byte[] byteArrayExtra = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    if (byteArrayExtra != null) {
                        BluetoothService.this.sendInfo = intent.getStringExtra("SEND_INFO");
                        BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_CONFIG_UUID, byteArrayExtra, BluetoothService.this.sendInfo);
                        break;
                    }
                    break;
                case "huitop_ui_server_start":
                    byte[] byteArrayExtra2 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    String stringExtra2 = intent.getStringExtra("fileuri");
                    BluetoothService.this.mIsBinFile = intent.getBooleanExtra("isbinfile", false);
                    BluetoothService.this.mIsNeedFlip = intent.getBooleanExtra("isneedflip", false);
                    int intExtra = intent.getIntExtra("watchui_type", 0);
                    Logger.t(BluetoothService.TAG).i("开始UI升级流程:" + BluetoothService.this.mIsNeedFlip, new Object[0]);
                    BluetoothService.this.mWatchUIType = EWatchUIType.getEWatchUIType(intExtra);
                    BluetoothService.this.mFileUiPath = Uri.parse(stringExtra2);
                    if (HBandApplication.isRecodeDialTransfer) {
                        HBLogger.dailTransferLog("Send:#开始UI升级#:" + ConvertHelper.byte2HexForShow(byteArrayExtra2));
                    }
                    BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, byteArrayExtra2, null);
                    Logger.t(BluetoothService.TAG).i("mFileUiPath:" + BluetoothService.this.mFileUiPath, new Object[0]);
                    break;
                case "_REQUEST_MTU":
                    BluetoothService.this.isManualRequestMtu = true;
                    if (BluetoothService.this.mBluetoothGatt != null) {
                        BluetoothService.this.mBluetoothGatt.requestMtu(247);
                        break;
                    }
                    break;
                case "bp_server":
                    BluetoothService.this.bpOption = stringExtra;
                    byte[] byteArrayExtra3 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    if (TextUtils.equals(BluetoothService.this.bpOption, BPHandler.READ_BP_NORMAL_UNNOTIFY) || TextUtils.equals(BluetoothService.this.bpOption, BPHandler.READ_BP_PRIVATE_UNNOTIFY)) {
                        BluetoothService.this.closeNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra3, "血压ADC不带监听");
                        break;
                    } else {
                        BluetoothService.this.bleNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra3, "血压ADC带监听");
                        break;
                    }
                    break;
                case "AGPS_DATA_TRANSFER_CONTENT":
                    BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_CONFIG_UUID, intent.getByteArrayExtra(BleIntentPut.BLE_CMD), "星历数据");
                    break;
                case "bbc_want_disconnecting_device":
                    HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + "-广播断开->手动断开连接");
                    Logger.t(BluetoothService.TAG).d("WANT_DISCONNECTING_DEVICE");
                    SpUtil.saveString(BluetoothService.this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
                    BluetoothService.this.autoScanAddress = "";
                    BluetoothService.this.ble133Address = "";
                    BluetoothService.this.isManualDisconnect = true;
                    HBLogger.bleConnectLog("========================================>【收到广播  手动断开先设置成 true】 " + action);
                    SqlHelperUtil.updateMac(BluetoothService.this.mContext);
                    BluetoothService.this.isStartScanLooper = false;
                    BluetoothService.this.stopScan();
                    BluetoothService.this.stopLooper();
                    BluetoothService.this.bleClose(ConnectDetails.CloseType.HANDLE_TO_DISCONNECT);
                    BluetoothService.this.stopScan();
                    BluetoothService.this.stopLooper();
                    HBLogger.bleConnectLog("WANT_DISCONNECTING_DEVICE:" + stringExtra);
                    BluetoothService.this.bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_SUCCESS);
                    break;
                case "ACTION_START_RECORDING":
                    BluetoothService.this.startRecording(intent.getBooleanExtra(AIRecordingUtil.KEY_IS_QA, true));
                    break;
                case "AGPS_DATA_TRANSFER_XXX":
                    byte[] byteArrayExtra4 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    Logger.t(BluetoothService.TAG).i("星历数据开始升级流程【" + stringExtra + "】：" + ConvertHelper.byte2HexForShow(byteArrayExtra4), new Object[0]);
                    HBLogger.dailTransferLog("星历数据开始升级流程【" + stringExtra + "】：" + ConvertHelper.byte2HexForShow(byteArrayExtra4));
                    BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, byteArrayExtra4, stringExtra);
                    break;
                case "ecg_server":
                    BluetoothService.this.bpOption = stringExtra;
                    byte[] byteArrayExtra5 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    if (!TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_ECG_NOTIFY)) {
                        if (!TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_ECG_UNNOTIFY)) {
                            if (!TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_FTT_START_NOTIFY)) {
                                if (!TextUtils.equals(BluetoothService.this.bpOption, EcgAppHandler.START_FTT_START_UNNOTIFY)) {
                                    if (TextUtils.equals(BluetoothService.this.bpOption, ECGMultiLeadDetectHandler.OPT_START_DETECT)) {
                                        BluetoothService.this.bleNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra5, BluetoothService.this.bpOption);
                                        break;
                                    } else if (TextUtils.equals(BluetoothService.this.bpOption, ECGMultiLeadDetectHandler.OPT_STOP_DETECT)) {
                                        BluetoothService.this.closeNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra5, BluetoothService.this.bpOption);
                                        break;
                                    }
                                } else {
                                    BluetoothService.this.closeNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra5, "ftt start unnotify");
                                    break;
                                }
                            } else {
                                BluetoothService.this.bleNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra5, "ftt start notify");
                                break;
                            }
                        } else {
                            BluetoothService.this.closeNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra5, "ecg start unnotify");
                            break;
                        }
                    } else {
                        BluetoothService.this.bleNotify(BleProfile.BP_SERVICE_UUID, BleProfile.BP_READ_UUID, byteArrayExtra5, "ecg  start notify");
                        break;
                    }
                    break;
                case "bbc_want_password_check":
                    BluetoothService.this.isManualDisconnect = false;
                    String stringExtra3 = intent.getStringExtra(BleIntentPut.BLE_PWD);
                    Logger.t(BluetoothService.PWD_ACTION).i("BluetoothService------------WANT_PASSWORD_CHECK  password = " + stringExtra3, new Object[0]);
                    BluetoothService.this.wantCheckPassword(stringExtra3);
                    break;
                case "ACTION_TURN_FOREGROUND_CHECK_BLE":
                    BluetoothService.this.initialize("【APP从后台切换到前台】");
                    break;
                case "battery_server_read_data":
                    Logger.t(BluetoothService.TAG + "动画").e("BATTERY_SERVER_READ_DATA -》 readData ", new Object[0]);
                    BluetoothService.this.readData();
                    break;
                case "_CALL_INCOMING":
                    BluetoothService.this.stopRing();
                    byte[] bArr = new byte[20];
                    bArr[0] = -75;
                    bArr[1] = 1;
                    BluetoothService.this.bleSendBroadcast(BleProfile.FIND_PHONE_BY_WATCH_OPERATE, bArr);
                    break;
                case "read_rssi_value":
                    BluetoothService.this.readConnectRssi();
                    break;
                case "bbc_want_connect_device":
                    BluetoothService.this.isManualDisconnect = false;
                    BluetoothService.this.mScanCount = 0;
                    ConnectDetails.ConnectType connectType = (ConnectDetails.ConnectType) intent.getSerializableExtra(IntentPut.BLE_CONNECT_TYPE);
                    BluetoothService.this.isManualConnect = intent.getBooleanExtra(BleIntentPut.BLE_DEVICE_IS_MANUAL_CONNECT, false);
                    Logger.t(BluetoothService.TAG).i("连接设备,并查找服务,是否要自动连接=" + BluetoothService.this.isNeedAutoConnect, new Object[0]);
                    String stringExtra4 = intent.getStringExtra(BleIntentPut.BLE_DEVICE_ADDRESS);
                    String stringExtra5 = intent.getStringExtra(BleIntentPut.BLE_DEVICE_NAME);
                    if (connectType == ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_MAIN) {
                        HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + "-广播连接->自动回连");
                        BluetoothService.this.isStartScanLooper = true;
                        BluetoothService.this.isNeedAutoConnect = true;
                        BluetoothService.this.mScanCount = intent.getIntExtra(IntentPut.BLE_CONNECT_COUNT, 0);
                        BluetoothService.this.bleConnect(stringExtra4, stringExtra5, ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_MAIN, true);
                        break;
                    } else if (connectType == ConnectDetails.ConnectType.CONNECT_TYPE_JL_OTA_RECONNECT) {
                        HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + "-广播连接->杰理OTA回连");
                        BluetoothService.this.isStartScanLooper = false;
                        BluetoothService.this.isNeedAutoConnect = false;
                        BluetoothService.this.bleConnect(stringExtra4, stringExtra5, ConnectDetails.ConnectType.CONNECT_TYPE_JL_OTA_RECONNECT, true);
                        break;
                    } else if (connectType == ConnectDetails.ConnectType.CONNECT_TYPE_HANDLE_FROM_BROADCAST) {
                        HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + "-广播连接->手动连接");
                        BluetoothService.this.isStartScanLooper = false;
                        BluetoothService.this.isNeedAutoConnect = false;
                        BluetoothService.this.bleConnect(stringExtra4, stringExtra5, ConnectDetails.ConnectType.CONNECT_TYPE_HANDLE_FROM_BROADCAST, true);
                        break;
                    }
                    break;
                case "_ACTION_START_BLUETOOTH_SERVICE_FOREGROUND_":
                    Logger.t(NotificationUtil.TAG_FOREGROUND).w("---> 收到开启BluetoothService前台服务的消息", new Object[0]);
                    BluetoothService.this.startNotifyService();
                    NotificationUtil.startForegroundNotification(BluetoothService.this);
                    break;
                case "CUSTOM_WATCH_UI_CONFIG":
                    byte[] byteArrayExtra6 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    Logger.t(BluetoothService.TAG).i("自定义表盘数据配置【" + stringExtra + "】：" + ConvertHelper.byte2HexForShow(byteArrayExtra6), new Object[0]);
                    BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, byteArrayExtra6, stringExtra);
                    break;
                case "huitop_ui_server":
                    Logger.t(BluetoothService.TAG).i("UI升级流程", new Object[0]);
                    BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_READ_UUID, intent.getByteArrayExtra(BleIntentPut.BLE_CMD), null);
                    break;
                case "auto_connect_device_by_scan_after_oad_success":
                    BluetoothService.this.isManualDisconnect = false;
                    BluetoothService.this.autoConnectByScan(ConnectDetails.AutoConnectByScanType.AUTO_CONNECT_BY_SCAN_TYPE_AFTER_OAD);
                    break;
                case "bbc_batter_server":
                    byte[] byteArrayExtra7 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    Logger.t(BluetoothService.TAG).e("收到指令广播: cmd = " + ConvertHelper.byte2HexForShow(byteArrayExtra7) + " 是否连接 = " + HBandApplication.isConnected(), new Object[0]);
                    BluetoothService.this.bpOption = stringExtra;
                    if (stringExtra.contains(SportHandler.STEP_ACTION)) {
                        Logger.t(BluetoothService.TAG).e("写入计步读取: 》》》》》  " + ConvertHelper.byte2HexForShow(byteArrayExtra7) + " 是否连接 = " + HBandApplication.isConnected(), new Object[0]);
                    }
                    if (!stringExtra.equals(SportHandler.STEP_ACTION)) {
                        Logger.t(BluetoothService.TAG).d("option = " + stringExtra + " , cmd = " + ConvertHelper.byte2HexForShow(byteArrayExtra7));
                    }
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, byteArrayExtra7);
                    break;
                case "update_log_write":
                    BluetoothService bluetoothService = BluetoothService.this;
                    bluetoothService.isReadDataTime10 = SpUtil.getBoolean(bluetoothService.mContext, SputilVari.READ_DATA_10_MINUTE, true);
                    BluetoothService bluetoothService2 = BluetoothService.this;
                    bluetoothService2.isRecoderWriteChange = SpUtil.getBoolean(bluetoothService2.mContext, SputilVari.RECORDING_WRITE, true);
                    BluetoothService bluetoothService3 = BluetoothService.this;
                    bluetoothService3.isRecoderReconnect = SpUtil.getBoolean(bluetoothService3.mContext, SputilVari.RECORDING_RECONNECT, true);
                    Logger.t(BluetoothService.TAG).d("isReadDataTime10:" + BluetoothService.this.isReadDataTime10);
                    Logger.t(BluetoothService.TAG).d("isRecoderWriteChange:" + BluetoothService.this.isRecoderWriteChange);
                    Logger.t(BluetoothService.TAG).d("isRecoderReconnect:" + BluetoothService.this.isRecoderReconnect);
                    break;
                case "sms_register":
                    BluetoothService.this.registerSmsObserver();
                    break;
                case "CUSTOM_WATCH_DIAL_TRANSFER":
                    byte[] byteArrayExtra8 = intent.getByteArrayExtra(BleIntentPut.BLE_CMD);
                    Logger.t(BluetoothService.TAG).i("自定义表盘数据开始升级流程【" + stringExtra + "】：" + ConvertHelper.byte2HexForShow(byteArrayExtra8), new Object[0]);
                    BluetoothService.this.lastCmd = null;
                    BluetoothService.this.writeCmd(BleProfile.UI_SERVICE_UUID, BleProfile.UI_CONFIG_UUID, byteArrayExtra8, stringExtra);
                    break;
            }
        }
    };
    String sendInfo = null;
    boolean isCallMethod_scheduleRead = false;
    boolean isAfter2Seconds = false;
    String password = DEFAULT_PWD;
    byte[] lastCmd = null;
    private final BroadcastReceiver BluetoothOpen = new BroadcastReceiver() { // from class: com.veepoo.hband.ble.BluetoothService.18
        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) throws InterruptedException, NoSuchMethodException, SecurityException {
            String action = intent.getAction();
            if (action.equals(BleBroadCast.BLUETOOTH_OPEN_CLOSE)) {
                BluetoothService.this.initBleService(intent);
            } else if (action.equals("android.intent.action.LOCALE_CHANGED")) {
                Logger.t(BluetoothService.TAG).i("ACTION_LOCALE_CHANGED", new Object[0]);
                if (SpUtil.getBoolean(BluetoothService.this.getApplicationContext(), SputilVari.LANGUAGE_IS_SYS, true)) {
                    new BatteryHandler(BluetoothService.this.mContext).settingLanguage();
                }
            }
        }
    };
    private int mBleMtu = 20;
    private JLBroadcastReceiver jlBroadcastReceiver = new JLBroadcastReceiver();

    /* JADX INFO: Access modifiers changed from: private */
    public String getBluetoothOprateState(int i) {
        return i != 0 ? i != 8 ? i != 14 ? i != 22 ? i != 62 ? i != 133 ? i != 257 ? i != 19 ? i != 20 ? "" : "远程设备因资源不足终止连接" : "远程设备（如蓝牙外设）主动断开连接" : "蓝牙操作崩溃(通用失败错误码。可能原因包括协议栈错误、资源不足或未知错误)" : "Android源码错误(常见于连接不稳定，建议延迟重试。)" : "远程设备主动断开，需用户干预" : "被本地主机终止(本地设备终止连接（如主动调用 gatt.disconnect()）)" : "错误异常" : "连接超时" : "操作成功";
    }

    /* JADX INFO: Access modifiers changed from: private */
    public String getBluetoothState(int i) {
        return i != 0 ? i != 1 ? i != 2 ? i != 3 ? "" : "STATE_DISCONNECTING" : "STATE_CONNECTED" : "STATE_CONNECTING" : "STATE_DISCONNECTED";
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void getMessage(int i) {
    }

    static /* synthetic */ int access$1508(BluetoothService bluetoothService) {
        int i = bluetoothService.bleConnect133ErrorCount;
        bluetoothService.bleConnect133ErrorCount = i + 1;
        return i;
    }

    @Override // android.app.Service
    public void onCreate() {
        super.onCreate();
        Logger.t(TAG).e("onCreate", new Object[0]);
        registerSysBroadCaster();
        this.mScanner = BluetoothLeScannerCompat.getScanner();
        FileUtilQ fileUtilQ = new FileUtilQ(this.mContext);
        this.mFileUtilQ = fileUtilQ;
        this.mFileNamePath = fileUtilQ.get_pack_files_hbands();
        this.isRecoderWriteChange = SpUtil.getBoolean(this.mContext, SputilVari.RECORDING_WRITE, true);
        this.isRecoderReconnect = SpUtil.getBoolean(this.mContext, SputilVari.RECORDING_RECONNECT, true);
        initialize("【BluetoothService -onCreate-】" + HBandApplication.appInSystemInfo());
        startNotifyService();
        NotificationUtil.startForegroundNotification(this);
        this.mSmsUtil = new SmsUtil(this.mContext, this.mHandler);
        this.mPhoneStatReceiver = new PhoneStatReceiver();
        registerPhoneStateReceived();
        registerSmsObserver();
        initBleReadManager();
        this.notifyListenComponent = new ComponentName(this, (Class<?>) MessageNotifyCollectService.class);
        scheduleCmd();
        LocalBroadcastManager.getInstance(this).registerReceiver(this.bleGetBroadcast, getFilter());
        registerJLBroadcast();
        BleWriteAndResponseManager.getInstance().setResponseTimeoutListener(this);
    }

    private void registerPhoneStateReceived() {
        Logger.t(TAG).i("IncomingReceiver registerPhoneStateReceived:", new Object[0]);
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.setPriority(Integer.MAX_VALUE);
        intentFilter.addAction("android.intent.action.PHONE_STATE");
        intentFilter.addAction("android.intent.action.NEW_OUTGOING_CALL");
        intentFilter.addAction(BleProfile.PHONE_MESSAGE);
        if (Build.VERSION.SDK_INT >= 34) {
            registerReceiver(this.mPhoneStatReceiver, intentFilter, 2);
        } else {
            registerReceiver(this.mPhoneStatReceiver, intentFilter);
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void initBleReadManager() {
        if (this.bleReadManager != null) {
            this.bleReadManager = null;
        }
        BleReadManager bleReadManager = new BleReadManager(this.mContext);
        this.bleReadManager = bleReadManager;
        bleReadManager.setOnbleWriteCallback(this);
        try {
            Application application = getApplication();
            if (application instanceof HBandApplication) {
                Logger.t(TAG).i("application is instanceof HBandApplication", new Object[0]);
                this.bleReadManager.setEcgManager(((HBandApplication) application).getEcgManager());
            } else {
                this.bleReadManager.setEcgManager(EcgDeviceManager.getInstance(this.mContext));
                Logger.t(TAG).i("application not instanceof HBandApplication", new Object[0]);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void registerSmsObserver() {
        this.mSmsUtil.registerSmsObserver();
    }

    @Override // android.app.Service
    public int onStartCommand(Intent intent, int i, int i2) {
        Logger.t(TAG).e("onStartCommand", new Object[0]);
        return 1;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startNotifyService() {
        startService(new Intent(this, (Class<?>) MessageNotifyCollectService.class));
    }

    @Override // com.veepoo.hband.activity.callback.OnBleWriteCallback
    public void bleWriteCallback(UUID uuid, UUID uuid2, byte[] bArr) throws InterruptedException {
        writeCharacteristic(uuid, uuid2, bArr);
    }

    public class LocalBinder extends Binder {
        public LocalBinder() {
        }

        public BluetoothService getService() {
            return BluetoothService.this;
        }
    }

    @Override // android.app.Service
    public IBinder onBind(Intent intent) {
        return this.binder;
    }

    public boolean initialize(String str) {
        this.mScanCount = 0;
        HBLogger.bleConnectLog("BluetoothService: -initialize- | msg = " + str);
        if (this.mBluetoothManager == null) {
            BluetoothManager bluetoothManager = (BluetoothManager) getSystemService("bluetooth");
            this.mBluetoothManager = bluetoothManager;
            if (bluetoothManager == null) {
                Logger.t(TAG).e("Unable to initialize BluetoothManager.", new Object[0]);
                return false;
            }
        }
        BluetoothAdapter adapter = this.mBluetoothManager.getAdapter();
        this.mBluetoothAdapter = adapter;
        if (adapter == null) {
            Logger.t(TAG).e("Unable to obtain a BluetoothAdapter.", new Object[0]);
            return false;
        }
        if (adapter == null || !adapter.isEnabled()) {
            return false;
        }
        this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.2
            @Override // java.lang.Runnable
            public void run() throws InterruptedException, NoSuchMethodException, SecurityException {
                BluetoothService.this.autoConnectByScan(ConnectDetails.AutoConnectByScanType.AUTO_CONNECT_BY_SCAN_TYPE_START_BLUETOOTH);
            }
        }, 1500L);
        return true;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startLooper() {
        String str = TAG;
        Logger.t(str).e("-----------", new Object[0]);
        final String string = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
        if (TextUtils.isEmpty(string)) {
            return;
        }
        this.mScanCount = 0;
        this.isStartScanLooper = false;
        stopLooper();
        this.mScanScheTimer = new Timer();
        this.mDelayTimer = new Timer();
        Logger.t(str).e("开启循环", new Object[0]);
        this.mScanScheTimer.scheduleAtFixedRate(new TimerTask() { // from class: com.veepoo.hband.ble.BluetoothService.3
            @Override // java.util.TimerTask, java.lang.Runnable
            public void run() {
                if (BluetoothService.this.mScanCount >= 2) {
                    BluetoothService.this.isStartScanLooper = false;
                    BluetoothService.this.mScanCount = 0;
                    BluetoothService.this.stopLooper();
                    Logger.t(BluetoothService.TAG).e("service扫描了几分钟，没有找到想要的设备（循环结束）", new Object[0]);
                    NotificationUtil.showDeviceNotFoundNotification(BluetoothService.this.mContext);
                    ToastUtils.showDebug("扫描（10+5）*2秒后没有搜到到设备");
                    LocalBroadcastManager.getInstance(BluetoothService.this.mContext).sendBroadcast(new Intent(BleBroadCast.SCAN_DEVICE_NULL));
                    LocalBroadcastManager.getInstance(BluetoothService.this.mContext).sendBroadcast(new Intent(BleBroadCast.SCAN_DEVICE_OVET_TIME));
                    return;
                }
                BluetoothService.this.isStartScanLooper = true;
                if (BluetoothService.this.mBluetoothAdapter != null && BluetoothService.this.mBluetoothAdapter.isEnabled()) {
                    BluetoothService.this.isScanning = true;
                    BluetoothService.this.mScanCount++;
                    Logger.t(BluetoothService.TAG).e("扫描中（循环）:" + BluetoothService.this.mScanCount, new Object[0]);
                    BluetoothService.this.startScan(string);
                }
                if (BluetoothService.this.mDelayTimer != null) {
                    BluetoothService.this.mDelayTimer.schedule(new TimerTask() { // from class: com.veepoo.hband.ble.BluetoothService.3.1
                        @Override // java.util.TimerTask, java.lang.Runnable
                        public void run() {
                            if (BluetoothService.this.mBluetoothAdapter == null || !BluetoothService.this.mBluetoothAdapter.isEnabled()) {
                                return;
                            }
                            BluetoothService.this.isScanning = false;
                            Logger.t(BluetoothService.TAG).e("暂停了（循环）", new Object[0]);
                            BluetoothService.this.stopScan();
                        }
                    }, 10000L);
                }
            }
        }, 0L, 15000L);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void stopScan() {
        ScanCallback scanCallback;
        Logger.t(TAG).i("stopScan", new Object[0]);
        if (BluetoothUtil.isBluetoothAdapterPermissionEnable(this)) {
            BluetoothLeScannerCompat bluetoothLeScannerCompat = this.mScanner;
            if (bluetoothLeScannerCompat == null || (scanCallback = this.mScanCallback) == null) {
                return;
            }
            bluetoothLeScannerCompat.stopScan(scanCallback);
            HBLogger.bleConnectLog("=============>【停止扫描】<=============");
            this.mScanCallback = null;
            return;
        }
        ToastUtils.showDebug("没有蓝牙权限");
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startScan(final String str) {
        String str2 = TAG;
        Logger.t(str2).i("startScan", new Object[0]);
        if (isAppForeground(this.mContext)) {
            Logger.t(str2).i("APP在前台", new Object[0]);
        } else {
            Logger.t(str2).i("APP在后台", new Object[0]);
        }
        ScanSettings scanSettingsBuild = new ScanSettings.Builder().setLegacy(false).setScanMode(2).setReportDelay(1000L).setUseHardwareBatchingIfSupported(false).build();
        ArrayList arrayList = new ArrayList();
        ScanFilter.Builder builder = new ScanFilter.Builder();
        if (!TextUtils.isEmpty(str) && BluetoothAdapter.checkBluetoothAddress(str)) {
            Logger.t(str2).i("mac地址有效，添加扫描过滤", new Object[0]);
            builder = builder.setDeviceAddress(str);
            if (!isAppForeground(this.mContext)) {
                Logger.t(str2).i("app在后台，添加UUID过滤", new Object[0]);
                builder.setServiceUuid(serviceUuid);
            }
        }
        arrayList.add(builder.build());
        if (this.mScanCallback != null) {
            this.mScanCallback = null;
        }
        this.mScanCallback = new ScanCallback() { // from class: com.veepoo.hband.ble.BluetoothService.4
            @Override // no.nordicsemi.android.support.v18.scanner.ScanCallback
            public void onScanResult(int i, ScanResult scanResult) {
                super.onScanResult(i, scanResult);
            }

            @Override // no.nordicsemi.android.support.v18.scanner.ScanCallback
            public void onBatchScanResults(List<ScanResult> list) throws InterruptedException, NoSuchMethodException, SecurityException {
                super.onBatchScanResults(list);
                Logger.t(BluetoothService.TAG).i("onBatchScanResults:" + list.size(), new Object[0]);
                if (!BluetoothService.this.isManualDisconnect || list.size() != 0) {
                    if (SpUtil.getBoolean(BluetoothService.this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false)) {
                        BluetoothService.this.stopScan();
                        return;
                    }
                    if (list.size() == 0) {
                        return;
                    }
                    BluetoothService.this.tellMainConnecting(str, "搜索回调");
                    HBLogger.bleConnectLog("搜索重连设备【" + str + "】中,(扫描到设备列表，开始检查是否搜到) - 通知主界面->正在连接...");
                    for (int i = 0; i < list.size(); i++) {
                        ScanResult scanResult = list.get(i);
                        BluetoothDevice device = scanResult.getDevice();
                        String address = device.getAddress();
                        Logger.t(BluetoothService.TAG).i("扫描设备中：" + address + ",rssi:" + scanResult.getRssi() + ",deviceName:" + device.getName() + " autoScanAddress = " + BluetoothService.this.autoScanAddress + " isScanning = " + BluetoothService.this.isScanning, new Object[0]);
                        if (BluetoothService.this.isScanning && TextUtils.equals(address, BluetoothService.this.autoScanAddress)) {
                            BluetoothService.this.isScanning = false;
                            BluetoothService.this.stopScan();
                            BluetoothService.this.stopLooper();
                            Logger.t(BluetoothService.TAG).i("扫描到设备了", new Object[0]);
                            byte[] bytes = scanResult.getScanRecord().getBytes();
                            String name = BleUtil.parseAdertisedData(bytes).getName();
                            BluetoothService.this.mDeviceName = name;
                            Logger.t(BluetoothService.TAG).i("扫描到设备了,开始连接，设备广播名称=" + ConvertHelper.byte2HexForShow(bytes), new Object[0]);
                            Logger.t(BluetoothService.TAG).i("扫描到设备了,开始连接，设备广播名称=" + name, new Object[0]);
                            HBLogger.bleConnectLog("搜索到重连设备【" + str + "】 - 开始连接设备。");
                            BluetoothService bluetoothService = BluetoothService.this;
                            bluetoothService.bleConnect(bluetoothService.autoScanAddress, name, ConnectDetails.ConnectType.CONNECT_TYPE_AFTER_SCAN, false);
                            return;
                        }
                    }
                    return;
                }
                BluetoothService.this.stopScan();
            }

            @Override // no.nordicsemi.android.support.v18.scanner.ScanCallback
            public void onScanFailed(int i) {
                super.onScanFailed(i);
                Log.i(BluetoothService.TAG, "onScanFailed:" + i);
            }
        };
        if (BluetoothUtil.isBluetoothAdapterPermissionEnable(this)) {
            HBLogger.bleConnectLog("开始【扫描蓝牙设备】 上一个连接的设备地址：" + str);
            ScanCallback scanCallback = this.mScanCallback;
            if (scanCallback != null) {
                this.mScanner.startScan(arrayList, scanSettingsBuild, scanCallback);
                return;
            } else {
                startScan(str);
                return;
            }
        }
        ToastUtils.showDebug("没有蓝牙权限");
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void stopLooper() {
        Logger.t(TAG).e("结束循环", new Object[0]);
        this.isScanning = false;
        Timer timer = this.mDelayTimer;
        if (timer != null) {
            timer.cancel();
            this.mDelayTimer = null;
        }
        Timer timer2 = this.mScanScheTimer;
        if (timer2 != null) {
            timer2.cancel();
            this.mScanScheTimer = null;
        }
    }

    private IntentFilter getFilter() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BleBroadCast.WANT_CONNECT_DEVICE);
        intentFilter.addAction(BleBroadCast.WANT_DISCONNECTING_DEVICE);
        intentFilter.addAction(BleBroadCast.AUTO_CONNECT_DEVICE_BY_SCAN_AFTER_OAD_SUCCESS);
        intentFilter.addAction(BleBroadCast.WANT_PASSWORD_CHECK);
        intentFilter.addAction(BleBroadCast.READ_RSSI_VALUE);
        intentFilter.addAction(BleBroadCast.UPDATE_LOG_WRITE);
        intentFilter.addAction(BleBroadCast.BATTERY_SERVER_READ_DATA);
        intentFilter.addAction(BleBroadCast.HUITOP_UI_SERVER);
        intentFilter.addAction(BleBroadCast.HUITOP_UI_SERVER_START);
        intentFilter.addAction(BleBroadCast.AGPS_DATA_TRANSFER_XXX);
        intentFilter.addAction(BleBroadCast.AGPS_DATA_TRANSFER_CONTENT);
        intentFilter.addAction(BleBroadCast.AI_PREVIEW_DATA_TRANSFER);
        intentFilter.addAction(BleBroadCast.CUSTOM_WATCH_DIAL_TRANSFER);
        intentFilter.addAction(BleBroadCast.CUSTOM_WATCH_UI_CONFIG);
        intentFilter.addAction(BleBroadCast.BATTERY_SERVER);
        intentFilter.addAction(BleBroadCast.BP_SERVER);
        intentFilter.addAction(BleBroadCast.ECG_SERVER);
        intentFilter.addAction(BleBroadCast.SMS_REGISTER);
        intentFilter.addAction(PhoneStatReceiver.CALL_INCOMING);
        intentFilter.addAction(BleBroadCast.CUSTOM_WATCH_UI_CONFIG);
        intentFilter.addAction(HBandApplication.ACTION_TURN_FOREGROUND_CHECK_BLE);
        intentFilter.addAction(NotificationUtil.ACTION_START_BLUETOOTH_SERVICE_FOREGROUND);
        intentFilter.addAction(AIRecordingUtil.ACTION_START_RECORDING);
        intentFilter.addAction(AIRecordingUtil.ACTION_STOP_RECORDING);
        intentFilter.addAction(BleBroadCast.REQUEST_MTU);
        return intentFilter;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void autoConnectByAddress(final ConnectDetails.ConnectType connectType) throws InterruptedException, NoSuchMethodException, SecurityException {
        Logger.t(TAG).e("-autoConnectByAddress- ConnectType:" + connectType.getDes(), new Object[0]);
        try {
            Thread.sleep(300L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        String string = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
        String string2 = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_NAME, "");
        HBLogger.bleConnectLog("-autoConnectByAddress- type = " + connectType + " 历史地址 = " + string + " , isStartScanLooper = " + this.isStartScanLooper);
        if (!((BluetoothManager) getSystemService("bluetooth")).getAdapter().isEnabled()) {
            Logger.t(TAG).i("通知栏-蓝牙关闭,不可用", new Object[0]);
            return;
        }
        if (!TextUtils.isEmpty(string)) {
            String str = "蓝牙连接Gatt回调 【☆有历史设备☆】，开始自动连接,Gatt type[4-来自于操作状态失败后的回调，5-来自于断开后调用]:" + connectType;
            Logger.t(TAG).i(str, new Object[0]);
            HBLogger.bleConnectLog(str);
            this.isNeedAutoConnect = true;
            tellMainConnecting(string, "autoConnectByAddress:" + connectType.getDes());
            bleConnect(string, string2, connectType, false);
            return;
        }
        this.isNeedAutoConnect = false;
        if (connectType == ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_CONNECT && !TextUtils.isEmpty(this.ble133Address)) {
            HBLogger.bleConnectLog("【Important: 手动连接第" + this.bleConnect133ErrorCount + "次出现133错误，开始执行再次连接 bleClose(CloseType.CONNECT_FAIL_133) 1500ms 后 -> Connecting... 】");
            ToastUtils.showDebug("手动连接出现第" + this.bleConnect133ErrorCount + "次出现133错误 断开后 1.5秒尝试再次连接");
            bleClose(ConnectDetails.CloseType.CONNECT_FAIL_133);
            this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService$$ExternalSyntheticLambda0
                @Override // java.lang.Runnable
                public final void run() throws InterruptedException, NoSuchMethodException, SecurityException {
                    this.f$0.m695x9740ae57(connectType);
                }
            }, 1500L);
            return;
        }
        if (ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_DISCONNECT != connectType) {
            String str2 = "蓝牙连接Gatt回调 【★无历史设备★】，无法自动连接。ConnectType:" + connectType;
            Logger.t(TAG).i(str2, new Object[0]);
            HBLogger.bleConnectLog(str2);
            bleClose(ConnectDetails.CloseType.GATT_NO_HISTORY_ADDRESS);
        }
    }

    /* renamed from: lambda$autoConnectByAddress$0$com-veepoo-hband-ble-BluetoothService, reason: not valid java name */
    public /* synthetic */ void m695x9740ae57(ConnectDetails.ConnectType connectType) throws InterruptedException, NoSuchMethodException, SecurityException {
        bleConnect(this.ble133Address, this.mDeviceName, connectType, false);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void tellMainConnecting(String str, String str2) {
        if (com.jieli.jl_bt_ota.util.BluetoothUtil.isBluetoothEnable()) {
            Logger.t(TAG).i("发送重连 - " + str2, new Object[0]);
            Intent intent = new Intent(BleBroadCast.AUTO_CONNECT_ING);
            intent.putExtra("auto_scan_address", str);
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
            return;
        }
        Logger.t(TAG).i(">>>>>>>>>>>>>>>>>>>>>>>>>>蓝牙不可用不发送重连 - " + str2, new Object[0]);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void autoConnectByScan(final ConnectDetails.AutoConnectByScanType autoConnectByScanType) throws InterruptedException, NoSuchMethodException, SecurityException {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
        final String string = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
        HBLogger.bleConnectLog("-autoConnectByScan- Type:" + autoConnectByScanType.getDes() + "；是否连接 + " + z + " , lastConnectAddress = " + string + "");
        if (z) {
            return;
        }
        this.autoScanAddress = string;
        if (!TextUtils.isEmpty(string)) {
            this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.5
                @Override // java.lang.Runnable
                public void run() {
                    BluetoothService.this.tellMainConnecting(string, "通过扫描的自动连接:" + autoConnectByScanType.getDes());
                }
            }, 1800L);
            this.isNeedAutoConnect = true;
            if (this.mBluetoothAdapter != null) {
                if (HBandApplication.isBackground) {
                    String bindDeviceName = getBindDeviceName(this.autoScanAddress);
                    String str = "有历史设备 直接连接,连接类型:" + autoConnectByScanType;
                    Logger.t(TAG).i(str, new Object[0]);
                    HBLogger.bleConnectLog(str);
                    bleConnect(this.autoScanAddress, bindDeviceName, ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_CONNECT_IN_BIND_LIST, true);
                    return;
                }
                if (isContainBindDevice(this.autoScanAddress)) {
                    String bindDeviceName2 = getBindDeviceName(this.autoScanAddress);
                    String str2 = "打开app/固件升级成功 有历史设备，在绑定列表里面，直接连接,Type[10-刚打开app时,11-固件升级成功后]:" + autoConnectByScanType;
                    Logger.t(TAG).i(str2, new Object[0]);
                    HBLogger.bleConnectLog(str2);
                    bleConnect(this.autoScanAddress, bindDeviceName2, ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_CONNECT_IN_BIND_LIST, true);
                    return;
                }
                String str3 = "打开app/固件升级成功 有历史设备，不在绑定列表里面，开始扫描,Type[10-刚打开app时,11-固件升级成功后]:" + autoConnectByScanType;
                Logger.t(TAG).i(str3, new Object[0]);
                HBLogger.bleConnectLog(str3);
                if (BluetoothUtil.isBluetoothAdapterPermissionEnable(this)) {
                    if (Build.VERSION.SDK_INT > 22 && Build.VERSION.SDK_INT < 31) {
                        if (GPSUtil.isOPen(this.mContext) && ContextCompat.checkSelfPermission(this.mContext, "android.permission.ACCESS_FINE_LOCATION") == 0) {
                            startLooper();
                            return;
                        }
                        return;
                    }
                    startLooper();
                    return;
                }
                if (Build.VERSION.SDK_INT > 22 && Build.VERSION.SDK_INT < 31) {
                    ToastUtils.showDebug("蓝牙连接在android 6.0-android11 需要定位权限");
                    return;
                } else {
                    if (Build.VERSION.SDK_INT >= 31) {
                        ToastUtils.showDebug("蓝牙连接在android12需要搜索“附近设备”权限");
                        return;
                    }
                    return;
                }
            }
            return;
        }
        String str4 = "-autoConnectByScan- 无历史连接设备记录,Type:" + autoConnectByScanType.getDes();
        Logger.t(TAG).i(str4, new Object[0]);
        HBLogger.bleConnectLog(str4);
    }

    private void autoConnectByScan_backup(final ConnectDetails.AutoConnectByScanType autoConnectByScanType) throws InterruptedException, NoSuchMethodException, SecurityException {
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
        final String string = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
        HBLogger.bleConnectLog("-autoConnectByScan- Type:" + autoConnectByScanType.getDes() + "；是否连接 + " + z + " , lastConnectAddress = " + string + "");
        if (z) {
            return;
        }
        this.autoScanAddress = string;
        if (!TextUtils.isEmpty(string)) {
            this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.6
                @Override // java.lang.Runnable
                public void run() {
                    BluetoothService.this.tellMainConnecting(string, "通过扫描的自动连接:" + autoConnectByScanType.getDes());
                }
            }, 1800L);
            this.isNeedAutoConnect = true;
            if (this.mBluetoothAdapter != null) {
                if (isContainBindDevice(this.autoScanAddress)) {
                    String bindDeviceName = getBindDeviceName(this.autoScanAddress);
                    String str = "打开app/固件升级成功 有历史设备，在绑定列表里面，直接连接,Type[10-刚打开app时,11-固件升级成功后]:" + autoConnectByScanType;
                    Logger.t(TAG).i(str, new Object[0]);
                    HBLogger.bleConnectLog(str);
                    bleConnect(this.autoScanAddress, bindDeviceName, ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_CONNECT_IN_BIND_LIST, true);
                    return;
                }
                String str2 = "打开app/固件升级成功 有历史设备，不在绑定列表里面，开始扫描,Type[10-刚打开app时,11-固件升级成功后]:" + autoConnectByScanType;
                Logger.t(TAG).i(str2, new Object[0]);
                HBLogger.bleConnectLog(str2);
                if (BluetoothUtil.isBluetoothAdapterPermissionEnable(this)) {
                    if (Build.VERSION.SDK_INT > 22 && Build.VERSION.SDK_INT < 31) {
                        if (GPSUtil.isOPen(this.mContext) && ContextCompat.checkSelfPermission(this.mContext, "android.permission.ACCESS_FINE_LOCATION") == 0) {
                            startLooper();
                            return;
                        }
                        return;
                    }
                    startLooper();
                    return;
                }
                if (Build.VERSION.SDK_INT > 22 && Build.VERSION.SDK_INT < 31) {
                    ToastUtils.showDebug("蓝牙连接在android 6.0-android11 需要定位权限");
                    return;
                } else {
                    if (Build.VERSION.SDK_INT >= 31) {
                        ToastUtils.showDebug("蓝牙连接在android12需要搜索“附近设备”权限");
                        return;
                    }
                    return;
                }
            }
            return;
        }
        String str3 = "-autoConnectByScan- 无历史连接设备记录,Type:" + autoConnectByScanType.getDes();
        Logger.t(TAG).i(str3, new Object[0]);
        HBLogger.bleConnectLog(str3);
    }

    private boolean isContainBindDevice(String str) throws NoSuchMethodException, SecurityException {
        BluetoothAdapter defaultAdapter = BluetoothAdapter.getDefaultAdapter();
        boolean z = false;
        if (BluetoothUtil.isBluetoothAdapterPermissionEnable(this)) {
            Set<BluetoothDevice> bondedDevices = defaultAdapter.getBondedDevices();
            try {
                Method declaredMethod = BluetoothAdapter.class.getDeclaredMethod("getConnectionState", null);
                declaredMethod.setAccessible(true);
                if (((Integer) declaredMethod.invoke(defaultAdapter, null)).intValue() == 2) {
                    Iterator<BluetoothDevice> it = bondedDevices.iterator();
                    while (it.hasNext()) {
                        if (it.next().getAddress().equals(str)) {
                            z = true;
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return z;
    }

    public void connectWithAlarmService() throws InterruptedException, NoSuchMethodException, SecurityException {
        if (HBandApplication.isConnected()) {
            HBLogger.bleConnectLog("######################### :: 已连接无需处理");
            return;
        }
        String string = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
        if (TextUtils.isEmpty(string)) {
            HBLogger.bleConnectLog("######################### :: 无连接记录无需处理");
            return;
        }
        String bindDeviceName = getBindDeviceName(string);
        this.autoScanAddress = string;
        HBLogger.bleConnectLog("######################### :: 未连接去重连 >> " + HBandApplication.appInSystemInfo());
        bleConnect(this.autoScanAddress, bindDeviceName, ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_CONNECT_WITH_ALARM_SERVICE, true);
    }

    /* JADX WARN: Code restructure failed: missing block: B:11:0x0048, code lost:
    
        r0 = r2.getName();
     */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct code enable 'Show inconsistent code' option in preferences
    */
    private java.lang.String getBindDeviceName(java.lang.String r8) throws java.lang.NoSuchMethodException, java.lang.SecurityException {
        /*
            r7 = this;
            java.lang.String r0 = ""
            android.bluetooth.BluetoothAdapter r1 = android.bluetooth.BluetoothAdapter.getDefaultAdapter()
            java.util.Set r2 = r1.getBondedDevices()
            java.lang.Class<android.bluetooth.BluetoothAdapter> r3 = android.bluetooth.BluetoothAdapter.class
            java.lang.String r4 = "getConnectionState"
            r5 = 0
            r6 = r5
            java.lang.Class[] r6 = (java.lang.Class[]) r6     // Catch: java.lang.Exception -> L4a
            java.lang.reflect.Method r3 = r3.getDeclaredMethod(r4, r5)     // Catch: java.lang.Exception -> L4a
            r4 = 1
            r3.setAccessible(r4)     // Catch: java.lang.Exception -> L4a
            r4 = r5
            java.lang.Object[] r4 = (java.lang.Object[]) r4     // Catch: java.lang.Exception -> L4a
            java.lang.Object r1 = r3.invoke(r1, r5)     // Catch: java.lang.Exception -> L4a
            java.lang.Integer r1 = (java.lang.Integer) r1     // Catch: java.lang.Exception -> L4a
            int r1 = r1.intValue()     // Catch: java.lang.Exception -> L4a
            r3 = 2
            if (r1 != r3) goto L4e
            java.util.Iterator r1 = r2.iterator()     // Catch: java.lang.Exception -> L4a
        L2e:
            boolean r2 = r1.hasNext()     // Catch: java.lang.Exception -> L4a
            if (r2 == 0) goto L4e
            java.lang.Object r2 = r1.next()     // Catch: java.lang.Exception -> L4a
            android.bluetooth.BluetoothDevice r2 = (android.bluetooth.BluetoothDevice) r2     // Catch: java.lang.Exception -> L4a
            java.lang.String r3 = r2.getAddress()     // Catch: java.lang.Exception -> L4a
            boolean r3 = r3.equals(r8)     // Catch: java.lang.Exception -> L4a
            if (r3 == 0) goto L2e
            java.lang.String r8 = r2.getName()     // Catch: java.lang.Exception -> L4a
            r0 = r8
            goto L4e
        L4a:
            r8 = move-exception
            r8.printStackTrace()
        L4e:
            boolean r8 = android.text.TextUtils.isEmpty(r0)
            if (r8 == 0) goto L5e
            android.content.Context r8 = r7.mContext
            java.lang.String r0 = "ble_last_connect_name"
            java.lang.String r1 = "device"
            java.lang.String r0 = com.veepoo.hband.util.SpUtil.getString(r8, r0, r1)
        L5e:
            return r0
        */
        throw new UnsupportedOperationException("Method not decompiled: com.veepoo.hband.ble.BluetoothService.getBindDeviceName(java.lang.String):java.lang.String");
    }

    public static boolean isInOTA() {
        boolean z = SpUtil.getBoolean(HBandApplication.instance, JLOTAActivity.IS_JL_OTA_UPGRADING, false);
        Logger.t(TAG_JLOTA).e("是否处于升级中：" + z + ", JLOTAActivity = " + JLOTAActivity.isShow + ", JLOTATestActivity = " + JLOTATestActivity.isShow, new Object[0]);
        return JLOTAActivity.isShow || JLOTATestActivity.isShow || JLOTAActivity.isOTAUpgrading || BluetrumOTAActivity.isOTAUpgrading || BluetrumOTAActivity.isShow;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public synchronized void answerRingingCall() {
        try {
            Intent intent = new Intent("android.intent.action.HEADSET_PLUG");
            intent.addFlags(1073741824);
            intent.putExtra("state", 1);
            intent.putExtra("microphone", 1);
            intent.putExtra(LogContract.SessionColumns.NAME, "Headset");
            sendOrderedBroadcast(intent, "android.permission.CALL_PRIVILEGED");
            Intent intent2 = new Intent("android.intent.action.MEDIA_BUTTON");
            intent2.putExtra("android.intent.extra.KEY_EVENT", new KeyEvent(0, 79));
            sendOrderedBroadcast(intent2, "android.permission.CALL_PRIVILEGED");
            Intent intent3 = new Intent("android.intent.action.MEDIA_BUTTON");
            intent3.putExtra("android.intent.extra.KEY_EVENT", new KeyEvent(1, 79));
            sendOrderedBroadcast(intent3, "android.permission.CALL_PRIVILEGED");
            Intent intent4 = new Intent("android.intent.action.HEADSET_PLUG");
            intent4.addFlags(1073741824);
            intent4.putExtra("state", 0);
            intent4.putExtra("microphone", 1);
            intent4.putExtra(LogContract.SessionColumns.NAME, "Headset");
            sendOrderedBroadcast(intent4, "android.permission.CALL_PRIVILEGED");
        } catch (Exception e) {
            Log.i("answerRingingCall:", e.getMessage());
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void sendPasswordCheckCmd() throws InterruptedException {
        final byte[] pwdCmd = getPwdCmd();
        Logger.t(PWD_ACTION).e("发送密码==》 cmd = " + ConvertHelper.byte2HexForShow(pwdCmd), new Object[0]);
        HBLogger.bleConnectLog("*****开始A1密码校验，20秒后如果没有返回A1校验则失败*****");
        sendBleConnectAction("写入A1密码校验");
        writeCharacteristic(BATTERY_SERVICE_UUID, BATTERY_CONFIG_UUID, pwdCmd);
        this.mHandler.removeCallbacksAndMessages(null);
        this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.8
            @Override // java.lang.Runnable
            public void run() throws InterruptedException, NoSuchMethodException, SecurityException {
                if (!SpUtil.getBoolean(BluetoothService.this.mContext, SputilVari.BLE_PWD_CALLBACK, false)) {
                    if (BluetoothService.this.mBluetoothGatt == null) {
                        HBLogger.bleConnectLog("*****20秒后A1密码校验【无返回】-> 设备已断开*****");
                        BluetoothService.this.sendBleConnectAction("20秒后A1密码校验【无返回】");
                        ToastUtils.showDebug("已断开连接");
                        if (HBandApplication.isBackground) {
                            BluetoothService.this.startReconnect();
                            return;
                        } else {
                            BluetoothService.this.startLooper();
                            return;
                        }
                    }
                    if (HBandApplication.IS_PWD_4_SECOND_NOT_CALLBACK_DISCONNECT) {
                        HBLogger.bleConnectLog("*****20秒后A1密码校验【无返回】-> 断开设备重连*****");
                        HBLogger.bleWriteLog("4秒后密码没有返回验证，先断开连接再重新连接");
                        BluetoothService bluetoothService = BluetoothService.this;
                        bluetoothService.bleConnect(bluetoothService.mBluetoothGatt.getDevice().getAddress(), BluetoothService.this.mBluetoothGatt.getDevice().getName(), ConnectDetails.ConnectType.CONNECT_TYPE_PWD_NOT_CALLBACK, true);
                        ToastUtils.show("4秒后密码没有返回验证，先断开连接再重新连接");
                        return;
                    }
                    BluetoothService.this.sendBleConnectAction("20秒后密码没有返回验证，重发密码验证");
                    HBLogger.bleConnectLog("*****20秒后A1密码校验【无返回】-> 重发密码验证*****");
                    BluetoothService.this.isAfter2Seconds = true;
                    BluetoothService bluetoothService2 = BluetoothService.this;
                    bluetoothService2.refreshDeviceCache(bluetoothService2.mBluetoothGatt);
                    pwdCmd[14] = 0;
                    BluetoothService.this.writeCharacteristic(BleProfile.BATTERY_SERVICE_UUID, BleProfile.BATTERY_CONFIG_UUID, pwdCmd);
                    HBLogger.bleWriteLog("20秒后密码没有返回验证，重发密码验证");
                    return;
                }
                HBLogger.bleConnectLog("*****20秒内A1密码校验【有返回】*****");
                Logger.t(BluetoothService.PWD_ACTION).i("20秒后校验：密码有返回验证", new Object[0]);
            }
        }, 20000L);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startReconnect() throws InterruptedException, NoSuchMethodException, SecurityException {
        String string = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "");
        if (TextUtils.isEmpty(string)) {
            return;
        }
        String bindDeviceName = getBindDeviceName(string);
        HBLogger.bleConnectLog("【重连】------->" + HBandApplication.appInSystemInfo() + ",重连设备：" + string);
        bleConnect(string, bindDeviceName, ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_CONNECT_IN_BIND_LIST, true);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void postSOSAction() {
        if (this.receiveSOSTime == -1) {
            postSOS2Service();
            this.receiveSOSTime = System.currentTimeMillis();
            return;
        }
        long jCurrentTimeMillis = System.currentTimeMillis();
        Logger.t(TAG).e("收到sos ------------------> sos interval = " + (jCurrentTimeMillis - this.receiveSOSTime), new Object[0]);
        if (jCurrentTimeMillis - this.receiveSOSTime >= 30000) {
            postSOS2Service();
            this.receiveSOSTime = System.currentTimeMillis();
        }
    }

    private void postSOS2Service() {
        sendLogByLocalBroadcast("=========发送SOS信号到服务器=======...ing...", ShowLogActivity.ShowLog.Level.INFO);
        JsonObject jsonObject = new JsonObject();
        String deviceNumber = BleInfoUtil.getDeviceNumber(this.mContext);
        String string = SpUtil.getString(this.mContext, SputilVari.INFO_OADVERISON_FORSHOW, "00.01.01.00");
        String string2 = SpUtil.getString(this.mContext, SputilVari.INFO_OADVERISON_FORTEST, "00.01.01.00");
        String string3 = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "address");
        String appVersion = BaseUtil.getAppVersion(this.mContext);
        jsonObject.addProperty("mac", string3);
        jsonObject.addProperty("deviceNumber", deviceNumber);
        jsonObject.addProperty("deviceVersion", string);
        jsonObject.addProperty("deviceTestVersion", string2);
        jsonObject.addProperty("appSystem", HBandApplication.APP_TYPE);
        jsonObject.addProperty("appVersion", appVersion);
        String str = TAG;
        Logger.t(str).e("收到sos --> postSOS2Service :[ mac =" + string3 + ", deviceNumber = " + deviceNumber + ", deviceVersion = " + string + ", deviceTestVersion = " + string2 + ", appVersion = " + appVersion + " ]", new Object[0]);
        Subscriber<Response<String>> subscriber = new Subscriber<Response<String>>() { // from class: com.veepoo.hband.ble.BluetoothService.9
            @Override // rx.Observer
            public void onCompleted() {
                Logger.t(BluetoothService.TAG).e("收到sos postSOS2Service------------------------->onCompleted", new Object[0]);
                BluetoothService.sendLogByLocalBroadcast("=========发送SOS信号到服务器=======成功（onCompleted）", ShowLogActivity.ShowLog.Level.ERROR);
            }

            @Override // rx.Observer
            public void onError(Throwable th) {
                Logger.t(BluetoothService.TAG).e("收到sos postSOS2Service------------------------->onError e = " + th.getMessage(), new Object[0]);
                BluetoothService.sendLogByLocalBroadcast("=========发送SOS信号到服务器=======失败：" + th.getMessage(), ShowLogActivity.ShowLog.Level.ERROR);
            }

            @Override // rx.Observer
            public void onNext(Response<String> response) {
                BluetoothService.sendLogByLocalBroadcast("=========发送SOS信号到服务器=======成功（onNext）", ShowLogActivity.ShowLog.Level.ERROR);
                Logger.t(BluetoothService.TAG).e("收到sos postSOS2Service------------------------->onNext response = " + response.message() + " body = " + response.body() + HexStringBuilder.DEFAULT_SEPARATOR + response.isSuccessful(), new Object[0]);
            }
        };
        Logger.t(str).e("收到sos ------------------> postSOS2Service", new Object[0]);
        HttpUtil.getInstance(appVersion).postSOSAction(jsonObject, subscriber);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void phoneRing() throws IllegalStateException {
        Logger.t(TAG).e("执行响铃", new Object[0]);
        this.isRing = true;
        MediaPlayer mediaPlayerCreate = MediaPlayer.create(this, R.raw.findphone);
        this.mediaPlayer = mediaPlayerCreate;
        mediaPlayerCreate.setLooping(false);
        this.mediaPlayer.setVolume(0.8f, 0.8f);
        this.mediaPlayer.start();
        this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.10
            @Override // java.lang.Runnable
            public void run() {
                BluetoothService.this.stopRing();
            }
        }, 3000L);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public synchronized void stopRing() {
        MediaPlayer mediaPlayer;
        if (this.isRing && (mediaPlayer = this.mediaPlayer) != null) {
            this.isRing = false;
            mediaPlayer.stop();
            this.mediaPlayer.release();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void shackPhone() {
        Logger.t(TAG).e("执行振动", new Object[0]);
        ((Vibrator) getApplication().getSystemService("vibrator")).vibrate(new long[]{100, 10, 100, 1000}, -1);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void handleWatchSetting(String str, byte[] bArr) {
        str.hashCode();
        switch (str) {
            case "screen_ligth_time_operate":
                new ScrenLightTimeHandler(this.mContext).handler(bArr);
                break;
            case "heart_waring_operate":
                if (EAlarmRangeType.INSTANCE.getEAlarmRangeTypeByCode(bArr[6]) == EAlarmRangeType.TEMPERATURE_LOW_HIGH) {
                    Logger.t(AlarmRangeHandler.TAG).e("体温报警功能，数据上报：" + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
                    AlarmRangeHandler.INSTANCE.getInstance().handler(bArr, null, false);
                    AppSPUtil.setOpenTemperatureAlarmFunction(bArr[5] == 1);
                    break;
                } else {
                    new HeartWarningHandler(this.mContext).handler(bArr, false);
                    break;
                }
            case "long_seat_operate":
                new LongseatHanlder(this.mContext, 0, 0, 0).handlerLongseat(bArr, false);
                break;
            case "night_turn_opeate":
                new NightTurnWristHandler(this.mContext).getReturnData(bArr, false);
                break;
            case "screen_ligth_operate":
                new ScreenLightHanlder(this.mContext).handler(bArr);
                break;
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void judageTheSame2(byte[] bArr, String str) {
        DeviceFunctionHandler.getDevicePersonWatchSetting(this.mContext, bArr);
    }

    /* JADX INFO: Access modifiers changed from: private */
    /* JADX WARN: Removed duplicated region for block: B:102:0x0284  */
    /* JADX WARN: Removed duplicated region for block: B:104:0x0289  */
    /* JADX WARN: Removed duplicated region for block: B:119:0x0320  */
    /* JADX WARN: Removed duplicated region for block: B:122:0x0325  */
    /* JADX WARN: Removed duplicated region for block: B:123:0x0327  */
    /* JADX WARN: Removed duplicated region for block: B:129:0x0357  */
    /* JADX WARN: Removed duplicated region for block: B:130:0x0359  */
    /* JADX WARN: Removed duplicated region for block: B:133:0x035e  */
    /* JADX WARN: Removed duplicated region for block: B:134:0x0360  */
    /* JADX WARN: Removed duplicated region for block: B:137:0x038d A[ADDED_TO_REGION] */
    /* JADX WARN: Removed duplicated region for block: B:141:0x0394  */
    /* JADX WARN: Removed duplicated region for block: B:142:0x039f  */
    /* JADX WARN: Removed duplicated region for block: B:15:0x006e  */
    /* JADX WARN: Removed duplicated region for block: B:16:0x0079  */
    /* JADX WARN: Removed duplicated region for block: B:22:0x0092  */
    /* JADX WARN: Removed duplicated region for block: B:23:0x009f  */
    /* JADX WARN: Removed duplicated region for block: B:29:0x00ba  */
    /* JADX WARN: Removed duplicated region for block: B:30:0x00c7  */
    /* JADX WARN: Removed duplicated region for block: B:36:0x00e2  */
    /* JADX WARN: Removed duplicated region for block: B:37:0x00ef  */
    /* JADX WARN: Removed duplicated region for block: B:43:0x010a  */
    /* JADX WARN: Removed duplicated region for block: B:44:0x0117  */
    /* JADX WARN: Removed duplicated region for block: B:50:0x0132  */
    /* JADX WARN: Removed duplicated region for block: B:51:0x0140  */
    /* JADX WARN: Removed duplicated region for block: B:57:0x015b  */
    /* JADX WARN: Removed duplicated region for block: B:58:0x0168  */
    /* JADX WARN: Removed duplicated region for block: B:62:0x0181  */
    /* JADX WARN: Removed duplicated region for block: B:63:0x018e  */
    /* JADX WARN: Removed duplicated region for block: B:67:0x01a7  */
    /* JADX WARN: Removed duplicated region for block: B:68:0x01b4  */
    /* JADX WARN: Removed duplicated region for block: B:72:0x01cd  */
    /* JADX WARN: Removed duplicated region for block: B:73:0x01da  */
    /* JADX WARN: Removed duplicated region for block: B:77:0x01f3  */
    /* JADX WARN: Removed duplicated region for block: B:78:0x0200  */
    /* JADX WARN: Removed duplicated region for block: B:82:0x021f  */
    /* JADX WARN: Removed duplicated region for block: B:86:0x022c  */
    /* JADX WARN: Removed duplicated region for block: B:89:0x023f  */
    /* JADX WARN: Removed duplicated region for block: B:93:0x024d  */
    /* JADX WARN: Removed duplicated region for block: B:96:0x025c  */
    /* JADX WARN: Removed duplicated region for block: B:97:0x0266  */
    /*
        Code decompiled incorrectly, please refer to instructions dump.
        To view partially-correct code enable 'Show inconsistent code' option in preferences
    */
    public void judageTheSame(byte[] r18, java.lang.String r19) throws java.lang.InterruptedException {
        /*
            Method dump skipped, instructions count: 947
            To view this dump change 'Code comments level' option to 'DEBUG'
        */
        throw new UnsupportedOperationException("Method not decompiled: com.veepoo.hband.ble.BluetoothService.judageTheSame(byte[], java.lang.String):void");
    }

    public void readConnectRssi() {
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt != null) {
            bluetoothGatt.readRemoteRssi();
        }
    }

    public void writeCmd(UUID uuid, UUID uuid2, byte[] bArr, String str) throws InterruptedException, NoSuchMethodException, SecurityException {
        boolean zWriteCharacteristic;
        if (bArr == null) {
            Logger.t(TAG).i("-writeCmd- is error, value = null", new Object[0]);
            return;
        }
        if (JLOTAActivity.isShow || JLOTATestActivity.isShow) {
            ToastUtils.showDebug("杰理OTA升级中，不能发送其他数据");
            return;
        }
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt == null) {
            Logger.t(TAG).i("mBluetoothGatt is null", new Object[0]);
            return;
        }
        if (uuid == null || uuid2 == null) {
            Logger.t(TAG).i("service_UUID or  config_UUID is null", new Object[0]);
            return;
        }
        BluetoothGattService service = bluetoothGatt.getService(uuid);
        if (service == null) {
            Logger.t(TAG).i("Rx service not found! 服务找不到", new Object[0]);
            if (!BleProfileUtil.getAction(uuid2, bArr).equals(BleProfile.K_BT_OPERATE)) {
                bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_SERVICE);
                return;
            } else {
                Logger.t("连接测试").i("BD指令异常，服务还未找到", new Object[0]);
                return;
            }
        }
        BluetoothGattCharacteristic characteristic = service.getCharacteristic(uuid2);
        if (characteristic == null) {
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_CHARACTERISTIC);
            Logger.t(TAG).i("Rx charateristic not found!", new Object[0]);
            return;
        }
        characteristic.setValue(bArr);
        String strByte2HexForShow = ConvertHelper.byte2HexForShow(bArr);
        String action = BleProfileUtil.getAction(uuid2, bArr);
        characteristic.setWriteType(1);
        boolean checkPwdPassFlag = BleReadManager.getCheckPwdPassFlag();
        if (bArr == null) {
            return;
        }
        if (bArr[0] != -95 && !checkPwdPassFlag) {
            HBLogger.bleWriteLog("Error::::::出现异常现象,密码校验还未通过就发送其他指令");
            HBLogger.bleConnectLog("Error::::::密码校验未通过就发送其他指令 data = " + strByte2HexForShow);
            return;
        }
        BluetoothGatt bluetoothGatt2 = this.mBluetoothGatt;
        if (bluetoothGatt2 != null) {
            this.currentSendCMD = bArr;
            this.preSendServiceUUID = uuid;
            this.preSendConfigUUID = uuid2;
            zWriteCharacteristic = bluetoothGatt2.writeCharacteristic(characteristic);
            if (isShowLog("", bArr)) {
                Logger.t(TAG).i("写入数据 ===== 》 " + ConvertHelper.byte2HexForShow(bArr) + "   status = " + zWriteCharacteristic, new Object[0]);
            }
            if (bArr[0] == -95 && !uuid.equals(UI_SERVICE_UUID)) {
                StringBuilder sb = new StringBuilder();
                sb.append("密码校验指令，写入");
                sb.append(zWriteCharacteristic ? "成功" : "失败");
                HBLogger.bleWriteLog(sb.toString());
                StringBuilder sb2 = new StringBuilder();
                sb2.append("密码校验指令，写入");
                sb2.append(zWriteCharacteristic ? "成功" : "失败");
                sendBleConnectAction(sb2.toString());
                Printer printerT = Logger.t(TAG);
                StringBuilder sb3 = new StringBuilder();
                sb3.append("密码校验指令，写入");
                sb3.append(zWriteCharacteristic ? "成功" : "失败");
                printerT.e(sb3.toString(), new Object[0]);
                StringBuilder sb4 = new StringBuilder();
                sb4.append("*****密码校验指令，写入");
                sb4.append(zWriteCharacteristic ? "成功*****" : "失败*****");
                HBLogger.bleConnectLog(sb4.toString());
            }
            if (isWritePwd(bArr) && !uuid.equals(UI_SERVICE_UUID)) {
                hasSendPwdCMD = true;
                Logger.t(PWD_ACTION).i("【密码校验发送】 - > data = " + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
                Logger.t(PWD_ACTION).i("【密码校验发送】 - > isAfter2Seconds = " + this.isAfter2Seconds + " isStartScanLooper = " + this.isStartScanLooper, new Object[0]);
                if (this.isAfter2Seconds && this.isStartScanLooper) {
                    if (zWriteCharacteristic) {
                        this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.11
                            @Override // java.lang.Runnable
                            public void run() throws InterruptedException, NoSuchMethodException, SecurityException {
                                if (!SpUtil.getBoolean(BluetoothService.this.mContext, SputilVari.BLE_PWD_CALLBACK, false)) {
                                    BluetoothService.this.bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL);
                                    Logger.t(BluetoothService.PWD_ACTION).i("【密码校验发送】 没有收到第二次密码校验的返回 (2s后)", new Object[0]);
                                    HBLogger.bleConnectLog("*****第二次重发A1校验（4s->2s）两秒后没有收到密码校验返回*****");
                                } else {
                                    Logger.t(BluetoothService.PWD_ACTION).i("【密码校验发送】 收到第二次密码校验的返回", new Object[0]);
                                    HBLogger.bleConnectLog("*****第二次重发A1校验（4s->2s）两秒内收到密码校验返回*****");
                                }
                            }
                        }, 2000L);
                    } else {
                        Logger.t(PWD_ACTION).i("【密码校验发送】第二次密码写入失败", new Object[0]);
                        HBLogger.bleConnectLog("*****第二次重发A1校验写入密码失败->关闭蓝牙*****");
                        ToastUtils.showDebug("密码校验发送失败");
                        bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL);
                    }
                } else if (!zWriteCharacteristic) {
                    HBLogger.bleConnectLog("断开重连后，写入失败:CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL");
                    HBLogger.bleConnectLog("***** A1密码校验写入失败 *****");
                    SpUtil.saveBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
                    bleSendBroadcast(BleBroadCast.CONNECTED_DEVICE_FAIL);
                    ToastUtils.showDebug("【密码校验发送】第二次密码写入失败");
                    refreshDeviceCache(this.mBluetoothGatt);
                    bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL);
                }
                HBLogger.bleConnectLog("write(" + zWriteCharacteristic + ")>" + action + ">" + strByte2HexForShow);
            }
        } else {
            zWriteCharacteristic = false;
        }
        if (!TextUtils.isEmpty(str)) {
            Logger.t(TAG).e("write(" + zWriteCharacteristic + ")>: " + str, new Object[0]);
        }
        String str2 = "write(" + zWriteCharacteristic + ")>" + action + ">" + strByte2HexForShow;
        if (isShowLog(action, bArr)) {
            Logger.t(TAG).i(str2, new Object[0]);
        }
        if (uuid.equals(BATTERY_SERVICE_UUID)) {
            HBLogger.bleWriteLog(str2);
        }
        if (uuid.equals(UI_SERVICE_UUID)) {
            if (bArr.length < 20) {
                HBLogger.dailTransferLog("UI通道寫數據:---->write(" + zWriteCharacteristic + ")>: info = " + str + " :>" + strByte2HexForShow);
            } else {
                HBLogger.dailTransferLog("UI寫數據:---->write(" + zWriteCharacteristic + ")>:: info = " + str + " :>" + bArr.length);
            }
        }
        if (!zWriteCharacteristic) {
            if (BleWriteAndResponseManager.getInstance().isNeedHandleWriteFailedCMD(bArr, uuid, uuid2)) {
                BleWriteAndResponseManager.getInstance().cmdSendFailedTimesIncrease(bArr);
                BleWriteAndResponseManager.getInstance().printCMDSendFailedList();
                HBLogger.bleWriteLog("========>写入指令失败" + ConvertHelper.byte2HexForShow(bArr) + "<========");
                int cMDSendFailedTimes = BleWriteAndResponseManager.getInstance().getCMDSendFailedTimes(bArr);
                WatchFaceTransferManager.getInstance().handlerDataSendResult(bArr, uuid, uuid2, cMDSendFailedTimes);
                AIPreviewSendManger.getInstance().handlerDataSendResult(bArr, uuid, uuid2, cMDSendFailedTimes);
                if (cMDSendFailedTimes <= 3) {
                    SystemClock.sleep(500L);
                    HBLogger.bleWriteLog("========>第" + cMDSendFailedTimes + "次写入指令:" + ConvertHelper.byte2HexForShow(bArr) + "失败，再次重写写入指令<========");
                    writeCharacteristic(this.preSendServiceUUID, this.preSendConfigUUID, this.currentSendCMD);
                    return;
                }
                BleWriteAndResponseManager.getInstance().clearWriteFailRecodes();
                HBLogger.bleWriteLog("========>连续" + cMDSendFailedTimes + "次写入指令:" + ConvertHelper.byte2HexForShow(bArr) + "失败，通知断开蓝牙<========");
                if (HBandApplication.isBackground) {
                    if (MainActivity.isReadTenMinuteData && BleWriteAndResponseManager.getInstance().isCMDNeedWriteCheck(bArr, uuid, uuid2)) {
                        Logger.t(TAG).e("后台读取写入指令失败，结束读取", new Object[0]);
                        HBLogger.bleWriteLog("===============>后台读取写入指令失败，结束读取");
                        this.bleReadManager.readFinishWithWriteFailed("后台读取写入指令失败，结束读取");
                        return;
                    }
                    return;
                }
                if (BleWriteAndResponseManager.getInstance().isData3TimesSendFailedNeedGattClose(uuid, uuid2)) {
                    bleClose(ConnectDetails.CloseType.WRITE_CMD_3TIMES_WRITE_FAILED);
                    return;
                }
                return;
            }
            return;
        }
        WatchFaceTransferManager.getInstance().handlerDataSendResult(bArr, uuid, uuid2, 0);
        AIPreviewSendManger.getInstance().handlerDataSendResult(bArr, uuid, uuid2, 0);
        BleWriteAndResponseManager.getInstance().startTimeoutCheckTask(bArr, uuid, uuid2);
    }

    @Override // com.veepoo.hband.ble.BleWriteAndResponseManager.OnResponseTimeoutListener
    public void onResponseTimeout(byte[] bArr, byte[] bArr2, int i) throws InterruptedException {
        sendBleConnectAction("指令：" + ConvertHelper.byte2HexForShow(bArr) + "， 第" + i + "次出现回复超时");
        Logger.t(BleWriteAndResponseManager.TAG).i("指令：" + ConvertHelper.byte2HexForShow(bArr) + "， 第" + i + "次出现回复超时", new Object[0]);
        HBLogger.bleWriteLog("指令：" + ConvertHelper.byte2HexForShow(bArr) + "， 第" + i + "次出现回复超时, 开始重新发送数据。");
        writeCharacteristic(this.preSendServiceUUID, this.preSendConfigUUID, bArr);
    }

    @Override // com.veepoo.hband.ble.BleWriteAndResponseManager.OnResponseTimeoutListener
    public void on3TimesNoResponse(byte[] bArr, byte[] bArr2) throws InterruptedException, NoSuchMethodException, SecurityException {
        BleWriteAndResponseManager.getInstance().clearResponseTimeoutRecodes();
        if (HBandApplication.isBackground) {
            if (MainActivity.isReadTenMinuteData) {
                Logger.t(TAG).e("后台读取写入指令失败，结束读取", new Object[0]);
                HBLogger.bleWriteLog("===============>后台读取写入指令失败，结束读取");
                sendBleConnectAction("指令" + ConvertHelper.byte2HexForShow(bArr) + "连续3次后台出现未回复，结束读取");
                this.bleReadManager.readFinishWithWriteFailed("后台读取写入指令失败，结束读取");
                return;
            }
            return;
        }
        sendBleConnectAction("指令" + ConvertHelper.byte2HexForShow(bArr) + "连续3次前天出现未回复，断开重连");
        this.bleReadManager.readFinishWithWriteFailed("5s没有回复，结束读取");
        bleClose(ConnectDetails.CloseType.WRITE_CMD_3TIMES_NO_RESPONSE);
    }

    private boolean isWritePwd(byte[] bArr) {
        return bArr != null && bArr.length > 1 && bArr[0] == -95;
    }

    public void writeCharacteristic(UUID uuid, UUID uuid2, byte[] bArr) throws InterruptedException {
        try {
            this.mCommandList.put(new BleCmd(uuid, uuid2, bArr));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public void scheduleCmd() {
        ExecutorService executorService = this.cmdSendPool;
        if (executorService != null) {
            executorService.shutdown();
        }
        ExecutorService executorServiceNewSingleThreadExecutor = Executors.newSingleThreadExecutor();
        this.cmdSendPool = executorServiceNewSingleThreadExecutor;
        executorServiceNewSingleThreadExecutor.submit(new SendThread());
    }

    class SendThread implements Runnable {
        SendThread() {
        }

        @Override // java.lang.Runnable
        public void run() throws InterruptedException {
            while (true) {
                try {
                    BleCmd bleCmdTake = BluetoothService.this.mCommandList.take();
                    if (bleCmdTake != null) {
                        SystemClock.sleep(120L);
                        BluetoothService.this.writeCmd(bleCmdTake.getService_UUID(), bleCmdTake.getConfig_UUID(), bleCmdTake.getValue(), null);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    public synchronized void bleNotify(UUID uuid, UUID uuid2, byte[] bArr, String str) {
        boolean zWriteDescriptor;
        String str2 = TAG;
        Logger.t(str2).e("打开蓝牙通知 open:" + str, new Object[0]);
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt == null) {
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_GATT_NULL);
            Logger.t(str2).e("sbluetooth bleNotify,mBluetoothGatt is null", new Object[0]);
            return;
        }
        BluetoothGattService service = bluetoothGatt.getService(uuid);
        if (service == null) {
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_SERVICE);
            Logger.t(str2).e("sbluetooth bleNotify,gattService is null,service_UUID=" + uuid.toString(), new Object[0]);
            return;
        }
        BluetoothGattCharacteristic characteristic = service.getCharacteristic(uuid2);
        if (characteristic == null) {
            Logger.t(str2).e("sbluetooth bleNotify,GattCharacteristic is null", new Object[0]);
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_CHARACTERISTIC);
            return;
        }
        if (bArr != null) {
            characteristic.setValue(bArr);
        }
        boolean z = true;
        this.mBluetoothGatt.setCharacteristicNotification(characteristic, true);
        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(DEC_2);
        if (descriptor == null) {
            Logger.t(str2).e("sbluetooth bleNotify,descriptor is null", new Object[0]);
            return;
        }
        descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
        SystemClock.sleep(200L);
        Logger.t(str2).e("sbluetooth bleNotify,Build.VERSION.SDK_INT :" + Build.VERSION.SDK_INT, new Object[0]);
        if (uuid.equals(UI_SERVICE_UUID) && this.mBluetoothGatt != null) {
            if (Build.VERSION.SDK_INT > 23) {
                characteristic.setWriteType(1);
            } else {
                characteristic.setWriteType(2);
            }
            zWriteDescriptor = this.mBluetoothGatt.writeDescriptor(descriptor);
        } else {
            zWriteDescriptor = this.mBluetoothGatt.writeDescriptor(descriptor);
            z = false;
        }
        if (!zWriteDescriptor) {
            bleClose(ConnectDetails.CloseType.CONNECT_SUCCESS_FAIL_TO_WRITE_DES);
            Logger.t(str2).e("打开通知失败=" + serviceUuid.toString(), new Object[0]);
        }
        Logger.t(str2).e("bleNotify write notify,status=" + zWriteDescriptor, new Object[0]);
        if (z) {
            HBLogger.bleConnectLog("bleNotify write  UiServeUuid=" + zWriteDescriptor);
        } else {
            HBLogger.bleConnectLog("bleNotify write  BatteryUuid=" + zWriteDescriptor);
        }
    }

    public void closeNotify(UUID uuid, UUID uuid2, byte[] bArr, String str) {
        String str2 = TAG;
        Logger.t(str2).e("bleNotify close:" + str, new Object[0]);
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt == null) {
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_GATT_NULL);
            Logger.t(str2).e("bleNotify,mBluetoothGatt is null", new Object[0]);
            return;
        }
        BluetoothGattService service = bluetoothGatt.getService(uuid);
        if (service == null) {
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_SERVICE);
            Logger.t(str2).e("bleNotify,gattService is null,service_UUID=" + uuid.toString(), new Object[0]);
            return;
        }
        BluetoothGattCharacteristic characteristic = service.getCharacteristic(uuid2);
        if (characteristic == null) {
            Logger.t(str2).e("bleNotify,GattCharacteristic is null", new Object[0]);
            bleSendBroadcast(BleBroadCast.SERVER_PROBLEM, ConnectTestManager.Result.ERROR_NO_VP_PROTOCOL_CHARACTERISTIC);
            return;
        }
        characteristic.setValue(bArr);
        this.mBluetoothGatt.setCharacteristicNotification(characteristic, false);
        BluetoothGattDescriptor descriptor = characteristic.getDescriptor(DEC_2);
        if (descriptor == null) {
            return;
        }
        descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
        boolean zWriteDescriptor = this.mBluetoothGatt.writeDescriptor(descriptor);
        Logger.t(str2).e("ECG_SERVER CLOSE notify,status=" + zWriteDescriptor, new Object[0]);
    }

    public boolean bleConnect(String str, String str2, ConnectDetails.ConnectType connectType, boolean z) throws InterruptedException, NoSuchMethodException, SecurityException {
        CONNECT_TYPE = connectType;
        String str3 = "自动连接扫描：" + connectType.getDes();
        String str4 = TAG;
        Logger.t(str4).i(str3, new Object[0]);
        HBLogger.bleConnectLog(str3);
        if (this.mBluetoothAdapter == null || TextUtils.isEmpty(str)) {
            initialize("【bleConnect方法调用，但BluetoothAdapter为空或 address = " + str + "】");
            Logger.t(str4).i("bleConnect initialize", new Object[0]);
            return false;
        }
        if (this.mBluetoothGatt != null) {
            Logger.t(str4).i("mBluetoothGatt is not null", new Object[0]);
            HBLogger.bleConnectLog("mBluetoothGatt is not null");
            try {
                HBLogger.bleConnectLog(connectType.getDes() + " -> BluetoothGatt.disconnect()");
                this.mBluetoothGatt.disconnect();
                Thread.sleep(100L);
            } catch (Exception e) {
                e.printStackTrace();
                Logger.t(TAG).i("mBluetoothGatt.disconnect() Exception", new Object[0]);
            }
            if (this.mBluetoothGatt != null) {
                Logger.t(TAG).i("mBluetoothGatt close", new Object[0]);
                try {
                    HBLogger.bleConnectLog(connectType.getDes() + " -> BluetoothGatt.close()");
                    this.mBluetoothGatt.close();
                } catch (Exception e2) {
                    e2.printStackTrace();
                    Logger.t(TAG).i("mBluetoothGatt.close Exception", new Object[0]);
                }
                HBLogger.bleConnectLog("mBluetoothGatt close");
            }
            if (this.mBluetoothGatt != null) {
                Logger.t(TAG).i("mBluetoothGatt null", new Object[0]);
                this.mBluetoothGatt = null;
                HBLogger.bleConnectLog(connectType.getDes() + " -> BluetoothGatt set null");
            }
        }
        BluetoothDevice remoteDevice = this.mBluetoothAdapter.getRemoteDevice(str);
        this.mCommandList.clear();
        if (remoteDevice != null) {
            HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + connectType.getDes() + " 真正的连接设备：->refreshAndConnect:" + remoteDevice.getName() + " | " + remoteDevice.getAddress());
            String str5 = "-bleConnect-: 开始执行连接：address = " + str + " , name = " + str2 + " ---- " + HBandApplication.appInSystemInfo();
            Logger.t(TAG).e(str5, new Object[0]);
            HBLogger.bleConnectLog(str5);
            if (HBandApplication.isBackground) {
                refreshAndConnect(remoteDevice, str2, "【【【【后台】】】】");
            } else {
                refreshAndConnect(remoteDevice, str2, "【【【【前台】】】】");
            }
        }
        this.mBluetoothDeviceAddress = str;
        return true;
    }

    public void refreshAndConnect(BluetoothDevice bluetoothDevice, String str, String str2) throws NoSuchMethodException, SecurityException {
        refreshDeviceCache(this.mBluetoothGatt);
        tellMainConnecting(bluetoothDevice.getAddress(), "开始连接");
        if (Build.VERSION.SDK_INT >= 23) {
            Logger.t(TAG).e("===> 连接BLE - TRANSPORT_AUTO - device:" + bluetoothDevice.getName() + " mac:" + bluetoothDevice.getAddress(), new Object[0]);
            this.mBluetoothGatt = bluetoothDevice.connectGatt(this.mContext, false, this.mGattCallback, 2);
        } else {
            this.mBluetoothGatt = bluetoothDevice.connectGatt(this.mContext, false, this.mGattCallback);
        }
        String name = bluetoothDevice.getName();
        String str3 = "refreshAndConnect==>>device=" + bluetoothDevice + ",device name=" + name + "  info = " + str2;
        Logger.t(TAG).i(str3, new Object[0]);
        HBLogger.bleConnectLog(str3);
        if (TextUtils.isEmpty(name) && !TextUtils.isEmpty(str)) {
            name = str;
        }
        if (!TextUtils.isEmpty(name)) {
            while (name.endsWith(HexStringBuilder.DEFAULT_SEPARATOR)) {
                name = name.substring(0, name.length() - 1);
            }
        }
        this.mDeviceName = name;
        HBLogger.bleConnectLog("-refreshAndConnect- deviceName:" + name + ",advertisedName:" + str);
        SpUtil.saveString(this.mContext, SputilVari.BLE_LAST_CONNECT_NAME, name);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public boolean refreshDeviceCache(BluetoothGatt bluetoothGatt) throws NoSuchMethodException, SecurityException {
        try {
            printMemoryInfo(this);
            Method method = bluetoothGatt.getClass().getMethod("refresh", new Class[0]);
            if (method != null) {
                return ((Boolean) method.invoke(bluetoothGatt, new Object[0])).booleanValue();
            }
        } catch (Exception unused) {
            Logger.t(TAG).e("An exception occured while refreshing device", new Object[0]);
        }
        return false;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void bleCloseByOTA133() throws InterruptedException {
        HBLogger.bleConnectLog("杰理OTA连接重连出现133");
        Logger.t(TAG_JLOTA).e("*****杰理OTA重连失败，断开连接，关闭Gatt*****", new Object[0]);
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt != null) {
            try {
                bluetoothGatt.disconnect();
                Thread.sleep(100L);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        BluetoothGatt bluetoothGatt2 = this.mBluetoothGatt;
        if (bluetoothGatt2 != null) {
            try {
                bluetoothGatt2.close();
                this.mBluetoothGatt = null;
            } catch (RuntimeException e2) {
                e2.printStackTrace();
            }
        }
    }

    public void bleClose(ConnectDetails.CloseType closeType) throws InterruptedException, NoSuchMethodException, SecurityException {
        String str = "-bleClose- 断开蓝牙，Type:" + closeType.getMsg() + ", isStartScanLooper = " + this.isStartScanLooper;
        Logger.t(TAG).w(str, new Object[0]);
        Logger.t(TAG_JLOTA).w(str, new Object[0]);
        HBLogger.bleConnectLog(str);
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt != null) {
            try {
                bluetoothGatt.disconnect();
                Thread.sleep(100L);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        BluetoothGatt bluetoothGatt2 = this.mBluetoothGatt;
        if (bluetoothGatt2 != null) {
            try {
                bluetoothGatt2.close();
                this.mBluetoothGatt = null;
            } catch (RuntimeException e2) {
                e2.printStackTrace();
            }
        }
        if (this.isStartScanLooper) {
            switch (AnonymousClass20.$SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[closeType.ordinal()]) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    if (HBandApplication.isBackground) {
                        startReconnect();
                        break;
                    } else {
                        startLooper();
                        break;
                    }
                case 7:
                    HBLogger.bleConnectLog("连续三次写数据失败，断开蓝牙后->开始重连扫描");
                    if (HBandApplication.isBackground) {
                        startReconnect();
                        break;
                    } else {
                        startLooper();
                        break;
                    }
                case 8:
                    HBLogger.bleConnectLog("连续三次数据回复超时，断开蓝牙后->开始重连扫描");
                    if (HBandApplication.isBackground) {
                        startReconnect();
                        break;
                    } else {
                        startLooper();
                        break;
                    }
            }
        }
        switch (closeType) {
            case CONNECT_SUCCESS_HAVE_SERVICE_BUT_ABSENCE:
                int i = this.tryCount;
                if (i < 5) {
                    this.tryCount = i + 1;
                    autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_WRITE_DES_FAIL);
                    break;
                }
                break;
            case CONNECT_SUCCESS_DISCOVERY_SERVICE_GATT_FAILED:
            case CONNECT_SUCCESS_FAIL_TO_WRITE_DES:
                autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_WRITE_DES_FAIL);
                break;
            case CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL:
                ToastUtils.showDebug(ConnectDetails.CloseType.CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL.getMsg());
                autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_PWD_WRITE_FAILED);
                break;
            case WRITE_CMD_3TIMES_WRITE_FAILED:
                HBLogger.bleConnectLog("连续三次写数据失败，断开蓝牙后->开始重连设备");
                autoConnectByAddress(ConnectDetails.ConnectType.WRITE_FAILED_3TIMES_ERROR);
                break;
            case WRITE_CMD_3TIMES_NO_RESPONSE:
                HBLogger.bleConnectLog("连续三次数据回复超时，断开蓝牙后->开始重连设备");
                autoConnectByAddress(ConnectDetails.ConnectType.WRITE_FAILED_3TIMES_ERROR);
                break;
        }
    }

    public void bleClose_backup(ConnectDetails.CloseType closeType) throws InterruptedException, NoSuchMethodException, SecurityException {
        String str = "-bleClose- 断开蓝牙，Type:" + closeType.getMsg() + ", isStartScanLooper = " + this.isStartScanLooper;
        Logger.t(TAG).w(str, new Object[0]);
        Logger.t(TAG_JLOTA).w(str, new Object[0]);
        HBLogger.bleConnectLog(str);
        BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
        if (bluetoothGatt != null) {
            try {
                bluetoothGatt.disconnect();
                Thread.sleep(100L);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        BluetoothGatt bluetoothGatt2 = this.mBluetoothGatt;
        if (bluetoothGatt2 != null) {
            try {
                bluetoothGatt2.close();
                this.mBluetoothGatt = null;
            } catch (RuntimeException e2) {
                e2.printStackTrace();
            }
        }
        if (this.isStartScanLooper) {
            switch (AnonymousClass20.$SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[closeType.ordinal()]) {
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    startLooper();
                    break;
                case 7:
                    HBLogger.bleConnectLog("连续三次写数据失败，断开蓝牙后->开始重连扫描");
                    startLooper();
                    break;
                case 8:
                    HBLogger.bleConnectLog("连续三次数据回复超时，断开蓝牙后->开始重连扫描");
                    startLooper();
                    break;
            }
        }
        switch (closeType) {
            case CONNECT_SUCCESS_HAVE_SERVICE_BUT_ABSENCE:
                int i = this.tryCount;
                if (i < 5) {
                    this.tryCount = i + 1;
                    autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_WRITE_DES_FAIL);
                    break;
                }
                break;
            case CONNECT_SUCCESS_DISCOVERY_SERVICE_GATT_FAILED:
            case CONNECT_SUCCESS_FAIL_TO_WRITE_DES:
                autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_AUTO_GATT_CALLBACK_WRITE_DES_FAIL);
                break;
            case CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL:
                ToastUtils.showDebug(ConnectDetails.CloseType.CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL.getMsg());
                autoConnectByAddress(ConnectDetails.ConnectType.CONNECT_TYPE_PWD_WRITE_FAILED);
                break;
            case WRITE_CMD_3TIMES_WRITE_FAILED:
                HBLogger.bleConnectLog("连续三次写数据失败，断开蓝牙后->开始重连设备");
                autoConnectByAddress(ConnectDetails.ConnectType.WRITE_FAILED_3TIMES_ERROR);
                break;
            case WRITE_CMD_3TIMES_NO_RESPONSE:
                HBLogger.bleConnectLog("连续三次数据回复超时，断开蓝牙后->开始重连设备");
                autoConnectByAddress(ConnectDetails.ConnectType.WRITE_FAILED_3TIMES_ERROR);
                break;
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void bleSendBroadcast(String str) {
        Intent intent = new Intent(str);
        if (str.equals(BleBroadCast.DISCONNECTED_DEVICE_SUCCESS) && HBandApplication.isUpdatingUI) {
            SpUtil.saveString(this.mContext, SputilVari.PIC_DIAL_PATH, "");
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void bleSendBroadcast(String str, ConnectTestManager.Result result) {
        Intent intent = new Intent(str);
        intent.putExtra("BLE_ERROR_MSG", result);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void bleSendBroadcast(String str, byte[] bArr) {
        Intent intent = new Intent(str);
        intent.putExtra(BleIntentPut.BLE_CMD, bArr);
        intent.putExtra("bluetoothaddress", this.mBluetoothDeviceAddress);
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
        if (str.equals(BleBroadCast.BP_ADC)) {
            Logger.t(TAG).w("发送ACTION ------------ " + str + " ECG测量", new Object[0]);
            return;
        }
        if (isShowLog(str, null)) {
            Logger.t(TAG).w("发送ACTION ------------ " + str, new Object[0]);
        }
    }

    @Override // android.app.Service
    public void onDestroy() throws InterruptedException, NoSuchMethodException, SecurityException {
        super.onDestroy();
        Logger.t(TAG).e("onDestroy", new Object[0]);
        this.bleReadManager = null;
        bleClose(ConnectDetails.CloseType.BLUE_SERVER_DESTROY);
        SpUtil.saveBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
        HBLogger.bleConnectLog("onDestroy");
        stopForeground(true);
        LocalBroadcastManager.getInstance(this).unregisterReceiver(this.bleGetBroadcast);
        unRegisterSysBroadCaster();
        unRegisterSmsObserver();
        ScheduledExecutorService scheduledExecutorService = this.scheduledThreadPool;
        if (scheduledExecutorService != null) {
            scheduledExecutorService.shutdown();
        }
        ExecutorService executorService = this.cmdSendPool;
        if (executorService != null) {
            executorService.shutdown();
        }
        this.isStartScanLooper = false;
        stopLooper();
        unregisterReceiver(this.mPhoneStatReceiver);
        unregisterJLBroadcast();
    }

    private void unRegisterSmsObserver() {
        SmsUtil smsUtil = this.mSmsUtil;
        if (smsUtil != null) {
            smsUtil.unRegisterSmsObserver();
        }
    }

    public void readData() {
        if (isInOTA()) {
            return;
        }
        HBandApplication.TEN_MINUTE_READ_COUNT++;
        StringBuilder sb = new StringBuilder();
        String str = TAG;
        sb.append(str);
        sb.append("动画");
        Logger.t(sb.toString()).e("readData isReadingSetting = " + this.isReadingSetting, new Object[0]);
        jugdeNotifyListenerService();
        SpUtil.saveString(this.mContext, SputilVari.BLE_LAST_CONNECT_SUCCESS_ADDRESS, this.mBluetoothDeviceAddress);
        Logger.t(str).e("管理-->开始读取设置数据->" + this.isReadingSetting, new Object[0]);
        if (this.isReadingSetting) {
            Logger.t(str).e("管理-->正在读取设置，3500 毫秒后读取数据", new Object[0]);
            this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.13
                @Override // java.lang.Runnable
                public void run() {
                    BluetoothService.this.scheduleRead();
                }
            }, 3500L);
        } else {
            Logger.t(str).e("管理-->设置完毕，立刻读取数据", new Object[0]);
            scheduleRead();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void scheduleRead() {
        if (BleChipPlatform.isBluetrum()) {
            try {
                this.isCallMethod_scheduleRead = true;
                if (SpUtil.getBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false)) {
                    startRealReadData();
                }
                ScheduledExecutorService scheduledExecutorService = this.scheduledThreadPool;
                if (scheduledExecutorService != null) {
                    scheduledExecutorService.shutdown();
                    return;
                }
                return;
            } catch (Exception e) {
                e.printStackTrace();
                return;
            }
        }
        Logger.t(TAG + "动画").e("scheduleRead", new Object[0]);
        ScheduledExecutorService scheduledExecutorService2 = this.scheduledThreadPool;
        if (scheduledExecutorService2 != null) {
            scheduledExecutorService2.shutdown();
        }
        this.isCallMethod_scheduleRead = true;
        ScheduledExecutorService scheduledExecutorServiceNewScheduledThreadPool = Executors.newScheduledThreadPool(1);
        this.scheduledThreadPool = scheduledExecutorServiceNewScheduledThreadPool;
        scheduledExecutorServiceNewScheduledThreadPool.scheduleAtFixedRate(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.14
            @Override // java.lang.Runnable
            public void run() {
                if (SpUtil.getBoolean(BluetoothService.this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false)) {
                    BluetoothService.this.startRealReadData();
                } else if (BluetoothService.this.scheduledThreadPool != null) {
                    BluetoothService.this.scheduledThreadPool.shutdown();
                }
            }
        }, 0L, 600L, TimeUnit.SECONDS);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startRealReadData() {
        String str = TAG;
        Logger.t(str).e("管理-->连接成功，开始读取数据", new Object[0]);
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.IS_IN_PTT, false);
        this.bleReadManager.setUserData(getUseDataBean());
        if (z) {
            ToastUtils.showDebug("正在PTT模式，不进行数据同步");
        }
        if (HBandApplication.isUpdatingUI) {
            ToastUtils.showDebug("正在传输UI(表盘)，不进行数据同步");
        }
        if (BleChipPlatform.isBluetrum() && HBandApplication.isBackground) {
            Logger.t(str).i("中科--后台不同步数据", new Object[0]);
            HBLogger.bleConnectLog("中科--后台不同步数据");
            return;
        }
        HBLogger.bleConnectLog("是否处于PTT测量模式：" + z + " . 是否处于UI传输过程中：" + HBandApplication.isUpdatingUI);
        if (!z && !HBandApplication.isUpdatingUI && !HBandApplication.isJLOTAUpdating()) {
            Logger.t(str + "动画").e("bleReadManager.readData()", new Object[0]);
            HBLogger.bleConnectLog(HBandApplication.appInSystemInfo() + "-【开始读取日常数据】");
            if (this.isCallMethod_scheduleRead) {
                Logger.t(str).i("管理--------------------------->主动调用scheduleRead====》手动同步", new Object[0]);
                HBLogger.dataUploadLog("【-scheduleRead-】 标记此次为手动同步");
                UploadValveUtil.manualSyncDataTag();
            } else {
                Logger.t(str).i("管理===========================>定时调用scheduleRead----》自动同步", new Object[0]);
                HBLogger.dataUploadLog("【-scheduleAtFixedRate-】 标记此次为十分钟定时同步");
                UploadValveUtil.timingSyncDataTag();
            }
            this.isCallMethod_scheduleRead = false;
            this.bleReadManager.readData();
            return;
        }
        MainActivity.isReadTenMinuteData = false;
        Logger.t(str).e("管理-->连接成功，正在ptt模式", new Object[0]);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void wantCheckPassword(String str) {
        this.password = str;
        BleReadManager.setCheckPwdPassFlag(false);
        SpUtil.saveBoolean(this.mContext, SputilVari.BLE_PWD_CALLBACK, false);
        HBLogger.bleWriteLog("服务->密码验证 : pwdString = " + str);
        HBLogger.bleConnectLog("开始密码验证>>>>");
        sendBleConnectAction("开始密码验证");
        SpUtil.saveBoolean(this.mContext, SputilVari.IS_GET_BLUETOOTH3_CMD, false);
        Logger.t(PWD_ACTION).e("bleNotify->密码验证 thread " + Thread.currentThread().getName(), new Object[0]);
        DeviceFunctionHandler.savePersonWatchSettingFalse_1(this.mContext);
        DeviceFunctionHandler.savePersonWatchSettingFalse_2(this.mContext);
        DeviceFunctionHandler.saveDeviceAll_1(this.mContext);
        DeviceFunctionHandler.saveDeviceAll_2(this.mContext);
        DeviceFunctionHandler.saveDeviceAll_3(this.mContext);
        saveMsgAllFalse();
        SpUtil.saveBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
        SqlHelperUtil.updateBleConnect(this.mContext);
        this.mBluetoothDevicePwd = str;
        DateFormat.is24HourFormat(this.mContext);
        this.isAfter2Seconds = false;
        LinkedBlockingQueue<BleCmd> linkedBlockingQueue = this.mCommandList;
        if (linkedBlockingQueue != null) {
            linkedBlockingQueue.clear();
        }
        Logger.t(PWD_ACTION).e("bleNotify->密码验证", new Object[0]);
        Logger.t(TAG_JLOTA).e("wantCheckPassword->密码验证 先去打开通知-->>openNotification", new Object[0]);
        openNotification(this.vpProtocolBleNotification, NotificationType.VP_PROTOCOL);
    }

    public byte[] getPwdCmd() {
        if (TextUtils.isEmpty(this.password)) {
            this.password = DEFAULT_PWD;
        }
        return PwdHandler.pwdTrans(this.password, (byte) 0, DateFormat.is24HourFormat(this.mContext), isManualConnect());
    }

    private boolean isManualConnect() {
        return CONNECT_TYPE == ConnectDetails.ConnectType.CONNECT_TYPE_HANDLE_FROM_BROADCAST && this.isManualConnect;
    }

    /* renamed from: com.veepoo.hband.ble.BluetoothService$20, reason: invalid class name */
    static /* synthetic */ class AnonymousClass20 {
        static final /* synthetic */ int[] $SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd;

        static {
            int[] iArr = new int[PwdHandler.Pwd.values().length];
            $SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd = iArr;
            try {
                iArr[PwdHandler.Pwd.CHECK_FAIL.ordinal()] = 1;
            } catch (NoSuchFieldError unused) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd[PwdHandler.Pwd.SETTING_SUCCESS.ordinal()] = 2;
            } catch (NoSuchFieldError unused2) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd[PwdHandler.Pwd.SETTING_FAIL.ordinal()] = 3;
            } catch (NoSuchFieldError unused3) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd[PwdHandler.Pwd.CHECK_AND_TIME_SUCCESS.ordinal()] = 4;
            } catch (NoSuchFieldError unused4) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd[PwdHandler.Pwd.CHECK_SUCCESS.ordinal()] = 5;
            } catch (NoSuchFieldError unused5) {
            }
            int[] iArr2 = new int[ConnectDetails.CloseType.values().length];
            $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType = iArr2;
            try {
                iArr2[ConnectDetails.CloseType.CONNECT_FAIL_133.ordinal()] = 1;
            } catch (NoSuchFieldError unused6) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.CONNECT_SUCCESS_NOT_FIND_SERVICE.ordinal()] = 2;
            } catch (NoSuchFieldError unused7) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.CONNECT_SUCCESS_HAVE_SERVICE_BUT_ABSENCE.ordinal()] = 3;
            } catch (NoSuchFieldError unused8) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.CONNECT_SUCCESS_DISCOVERY_SERVICE_GATT_FAILED.ordinal()] = 4;
            } catch (NoSuchFieldError unused9) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.CONNECT_SUCCESS_FAIL_TO_WRITE_DES.ordinal()] = 5;
            } catch (NoSuchFieldError unused10) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.CONNECT_SUCCESS_BUT_PWD_WRITE_FAIL.ordinal()] = 6;
            } catch (NoSuchFieldError unused11) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.WRITE_CMD_3TIMES_WRITE_FAILED.ordinal()] = 7;
            } catch (NoSuchFieldError unused12) {
            }
            try {
                $SwitchMap$com$veepoo$hband$ble$ConnectDetails$CloseType[ConnectDetails.CloseType.WRITE_CMD_3TIMES_NO_RESPONSE.ordinal()] = 8;
            } catch (NoSuchFieldError unused13) {
            }
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void optionDevicePwd(byte[] bArr) {
        String str = TAG;
        Logger.t(str).e("PwdHandler-密碼校驗信息-: | " + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
        int i = AnonymousClass20.$SwitchMap$com$veepoo$hband$ble$readmanager$PwdHandler$Pwd[PwdHandler.getReturnData(this.mContext, bArr).ordinal()];
        if (i == 1) {
            bleSendBroadcast(BleBroadCast.PASSWORD_CHECK_FAIL);
            Logger.t(str).i("密码错误", new Object[0]);
            BleReadManager.setCheckPwdPassFlag(false);
            return;
        }
        if (i == 2) {
            BleReadManager.setCheckPwdPassFlag(true);
            bleSendBroadcast(BleBroadCast.PASSWORD_MODIFY_SUCCESS);
            return;
        }
        if (i == 3) {
            BleReadManager.setCheckPwdPassFlag(false);
            bleSendBroadcast(BleBroadCast.PASSWORD_MODIFY_FAIL);
            return;
        }
        if (i == 4) {
            Logger.t(str).i("密码和时间都校验成功", new Object[0]);
        } else if (i != 5) {
            return;
        }
        BleReadManager.setCheckPwdPassFlag(true);
        Logger.t(str).i("密码正确", new Object[0]);
        Logger.t(str + "动画").i("密码正确", new Object[0]);
        connectSuccess(bArr);
        Logger.t(str).i("管理-->开始设置->" + this.isReadingSetting, new Object[0]);
        if (ConnectTestManager.isEnableConnectTest) {
            return;
        }
        this.isReadingSetting = true;
        this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.15
            @Override // java.lang.Runnable
            public void run() {
                BluetoothService.this.isReadingSetting = false;
                new HomeFunctionShowUtil().resetFunctionLine(BluetoothService.this.mContext);
                BluetoothService.this.bleSendBroadcast(BleBroadCast.CHANGE_FRAGMENT_LAYOUT);
                Logger.t(BluetoothService.TAG).i("管理-->结束设置->" + BluetoothService.this.isReadingSetting, new Object[0]);
            }
        }, 3500L);
        this.mHandler.postDelayed(new Runnable() { // from class: com.veepoo.hband.ble.BluetoothService.16
            @Override // java.lang.Runnable
            public void run() {
                if (BluetoothService.this.bleReadManager == null) {
                    BluetoothService.this.initBleReadManager();
                }
                BluetoothService.this.bleReadManager.readSetting();
            }
        }, 500L);
    }

    public BindDataBean getUseDataBean() {
        String string = SpUtil.getString(this.mContext, SputilVari.INFO_ACCOUNT_NAME, "");
        boolean z = SpUtil.getBoolean(this.mContext, SputilVari.BLE_IS_BINDER, false);
        BindDataBean bindDataBean = new BindDataBean();
        bindDataBean.setAccount(string);
        if (TextUtils.isEmpty(this.mBluetoothDeviceAddress)) {
            this.mBluetoothDeviceAddress = SpUtil.getString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, "no mac");
        }
        bindDataBean.setBluetoothAddress(this.mBluetoothDeviceAddress);
        bindDataBean.setBind(z);
        Logger.t(TAG).e("getUseDataBean=" + bindDataBean.toString(), new Object[0]);
        return bindDataBean;
    }

    private void connectSuccess(byte[] bArr) {
        this.mScanCount = 0;
        this.isStartScanLooper = false;
        stopScan();
        stopLooper();
        NotificationUtil.cancelNotification(this.mContext, 102);
        SpUtil.saveBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, true);
        SpUtil.saveString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS, this.mBluetoothDeviceAddress);
        SpUtil.saveString(this.mContext, SputilVari.BLE_LAST_CONNECT_ADDRESS_WONMENDETAIL, this.mBluetoothDeviceAddress);
        SpUtil.saveString(this.mContext, SputilVari.BLE_LAST_CONNECT_PASSWORD, this.mBluetoothDevicePwd);
        if (TextUtils.isEmpty(this.mDeviceName)) {
            this.mDeviceName = "";
        }
        if ((AppSPUtil.isHaveAIDialFunction() || AppSPUtil.isHaveAIQAFunction()) && HBandApplication.isAIFunctionEnable()) {
            LocalBroadcastSender.sendHaveAIFunctionAction();
        }
        SqlHelperUtil.updateBleConnect(this.mContext);
        SqlHelperUtil.updateMac(this.mContext);
        UserBean userbean = SqlHelperUtil.getUserbean(this.mContext);
        SpUtil.saveBoolean(this.mContext, SputilVari.BLE_IS_BINDER, ((userbean == null || userbean.getUUID() == null) ? "" : userbean.getUUID()).equals(this.mBluetoothDeviceAddress));
        SqlHelperUtil.updateBleBinder(this.mContext);
        AppSPUtil.updateManualMeasureFunctionWithBinder();
        if (bArr.length > 10) {
            String[] strArrByte2HexToStrArr = ConvertHelper.byte2HexToStrArr(bArr);
            String str = Integer.valueOf(strArrByte2HexToStrArr[4] + strArrByte2HexToStrArr[5], 16) + "";
            Logger.t("DeviceFunctionHandler").e("############# 密码校验：" + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
            Logger.t("DeviceFunctionHandler").e("############# 设备号：" + str, new Object[0]);
            String str2 = strArrByte2HexToStrArr[6] + "." + strArrByte2HexToStrArr[7] + "." + strArrByte2HexToStrArr[8];
            String str3 = strArrByte2HexToStrArr[6] + "." + strArrByte2HexToStrArr[7] + "." + strArrByte2HexToStrArr[8] + "." + strArrByte2HexToStrArr[9];
            if (str.equals("6592")) {
                DeviceFunctionHandler.updateBloodGlucoseTypeWith6592();
            }
            SpUtil.saveString(this.mContext, SputilVari.INFO_OADVERISON, str2);
            SpUtil.saveString(this.mContext, SputilVari.INFO_OADVERISON_FORTEST, str3);
            SpUtil.saveString(this.mContext, SputilVari.INFO_DEVICENUMBER_FORM_CONNECT, str);
            if (TextUtils.equals(strArrByte2HexToStrArr[9], "00")) {
                SpUtil.saveString(this.mContext, SputilVari.INFO_OADVERISON_FORSHOW, str2);
            } else {
                SpUtil.saveString(this.mContext, SputilVari.INFO_OADVERISON_FORSHOW, str3);
            }
            if (!BleInfoUtil.isDeviceNumberReverse(str)) {
                new AfterGetDeviceNumber(this.mContext).doIt();
            }
            Logger.t(TAG).i("deviceNumber=" + str + ",oadVersion=" + str3, new Object[0]);
        }
        AppLogManager.writeSystemInfo();
        SpUtil.saveBoolean(this.mContext, SputilVari.IS_HAVE_DRINK_DATA, false);
        if (bArr.length > 11) {
            byte b = bArr[10];
            if (b == 0) {
                SpUtil.saveBoolean(this.mContext, SputilVari.IS_HAVE_DRINK_DATA, false);
            } else if (b == 1) {
                SpUtil.saveBoolean(this.mContext, SputilVari.IS_HAVE_DRINK_DATA, true);
            }
        }
        bleSendBroadcast(BleBroadCast.CONNECTED_DEVICE_SUCCESS);
    }

    protected void refreshDeviceCache(BluetoothGatt bluetoothGatt, boolean z) throws NoSuchMethodException, SecurityException {
        if (bluetoothGatt == null) {
            return;
        }
        String str = TAG;
        Logger.t(str).i("refreshDeviceCache", new Object[0]);
        if (z || bluetoothGatt.getDevice().getBondState() == 10) {
            try {
                Method method = bluetoothGatt.getClass().getMethod("refresh", new Class[0]);
                if (method != null) {
                    boolean zBooleanValue = ((Boolean) method.invoke(bluetoothGatt, new Object[0])).booleanValue();
                    Logger.t(str).i("Refreshing result: " + zBooleanValue, new Object[0]);
                }
            } catch (Exception unused) {
                Logger.t(TAG).i("An exception occurred while refreshing device", new Object[0]);
            }
        }
    }

    private void saveMsgAllFalse() {
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_WECHAT, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_QQ, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_SINA, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_FACEBOOK, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_TWITTER, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_FLICKR, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_LINKEDIN, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_WHATSAPP, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_LINE, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_INSTAGRAM, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_SNAPCHAT, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_SKYPE, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_GMAIL, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_ALIWAWA, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_COMPANY_QQ, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_WXWORK, false);
        SpUtil.saveBoolean(this.mContext, SputilVari.MSG_IS_SUPPORT_DINGDING, false);
    }

    private ShowLogActivity.ShowLog.Level getLogLevel(String str) {
        if (str.contains("DF,FF,FF,1F")) {
            return ShowLogActivity.ShowLog.Level.ERROR;
        }
        return ShowLogActivity.ShowLog.Level.NORMAL;
    }

    public static void sendLogByLocalBroadcast(String str, ShowLogActivity.ShowLog.Level level) {
        if (HBandApplication.isShowRealTimeLog) {
            Intent intent = new Intent();
            intent.setAction("_ACTION_WRITE_LOG");
            intent.putExtra("_KEY_LOG", str);
            intent.putExtra("_KEY_LEVEL", level);
            LocalBroadcastManager.getInstance(HBandApplication.mContext).sendBroadcast(intent);
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void jugdeNotifyListenerService() {
        if (isNotifyCollectServiceRuning()) {
            return;
        }
        rebootServiceEnable();
        if (Build.VERSION.SDK_INT >= 24) {
            Logger.t(TAG).i("notifyListen requestRebind", new Object[0]);
            NotificationListenerService.requestRebind(this.notifyListenComponent);
        }
    }

    private boolean isNotifyCollectServiceRuning() throws SecurityException {
        boolean z;
        List<ActivityManager.RunningServiceInfo> runningServices = ((ActivityManager) getSystemService("activity")).getRunningServices(Integer.MAX_VALUE);
        if (runningServices == null || runningServices.isEmpty()) {
            z = false;
        } else {
            for (ActivityManager.RunningServiceInfo runningServiceInfo : runningServices) {
                int i = runningServiceInfo.pid;
                if (runningServiceInfo.service.equals(this.notifyListenComponent) && i == Process.myPid()) {
                    z = true;
                    break;
                }
            }
            z = false;
        }
        Logger.t(TAG).i("notifyListen find the notifylistener service:" + z, new Object[0]);
        return z;
    }

    private void rebootServiceEnable() {
        Logger.t(TAG).i("notifyListen rebootServiceEnable:" + Build.VERSION.SDK_INT, new Object[0]);
        PackageManager packageManager = getPackageManager();
        packageManager.setComponentEnabledSetting(this.notifyListenComponent, 2, 1);
        packageManager.setComponentEnabledSetting(this.notifyListenComponent, 1, 1);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void sendBlockContentTimerHuitop() throws InterruptedException, NoSuchMethodException, SecurityException {
        destroyBigSendCmdTimer();
        int i = current_block;
        if (i > all_block) {
            HBLogger.dailTransferLog("---发送结束---");
            Logger.t(TAG).i("发送结束", new Object[0]);
            if (HBandApplication.isRecodeDialTransfer) {
                HBLogger.dailTransferLog("======》表盘文件发送完成一共" + all_block + "包数据《======");
            }
            bleSendBroadcast(BleBroadCast.UPDATE_UI_DATA_SEND_FINISH);
            this.mHuitopUIUpdateHandler.reset();
            current_block = 0;
            all_block = 0;
            return;
        }
        byte[] cmdBlock = this.mHuitopUIUpdateHandler.getCmdBlock(i - 1);
        if (cmdBlock == null || this.pasueSend) {
            return;
        }
        createBigSendCmdTimer();
        if (HBandApplication.isRecodeDialTransfer) {
            HBLogger.dailTransferLog("Send:#表盘文件#第[" + current_block + WatchConstant.FAT_FS_ROOT + all_block + "]包#---> " + cmdBlock.length);
        }
        writeCmd(UI_SERVICE_UUID, UI_CONFIG_UUID, cmdBlock, null);
        this.lastCmd = cmdBlock;
        current_block++;
        this.mBigSendCmdTimer.schedule(new TimerTask() { // from class: com.veepoo.hband.ble.BluetoothService.17
            @Override // java.util.TimerTask, java.lang.Runnable
            public void run() {
                Logger.t(BluetoothService.TAG).i("mBigSendCmdTimer:大数据传输中断了", new Object[0]);
                BluetoothService.this.bleSendBroadcast(BleBroadCast.UPDATE_UI_SEND_BLOCK);
            }
        }, 60000L);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void createBigSendCmdTimer() {
        Timer timer;
        Timer timer2 = this.mBigSendCmdTimer;
        try {
            if (timer2 == null) {
                return;
            }
            try {
                timer2.cancel();
                this.mBigSendCmdTimer = null;
                timer = new Timer();
            } catch (RuntimeException e) {
                e.printStackTrace();
                timer = new Timer();
            }
            this.mBigSendCmdTimer = timer;
        } finally {
            this.mBigSendCmdTimer = new Timer();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void destroyBigSendCmdTimer() {
        try {
            try {
                Timer timer = this.mBigSendCmdTimer;
                if (timer != null) {
                    timer.cancel();
                }
            } catch (RuntimeException e) {
                e.printStackTrace();
            }
        } finally {
            this.mBigSendCmdTimer = null;
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void updateUIprogress() {
        Intent intent = new Intent(BleBroadCast.BIG_DATA_CONTENT_PROGRESS);
        intent.putExtra("current_block", current_block);
        intent.putExtra("all_block", all_block);
        LocalBroadcastManager.getInstance(this.mContext).sendBroadcast(intent);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void toCameraActivity(byte[] bArr) {
        if (bArr.length >= 20 && bArr[3] != 0) {
            if (!HBandApplication.isAppForeground()) {
                ToastUtils.showDebug("app在后台");
                HBandApplication.setTopApp(HBandApplication.instance);
                Intent intent = new Intent("android.intent.action.MAIN");
                intent.addCategory("android.intent.category.HOME");
                startActivity(intent);
            } else {
                ToastUtils.showDebug("app在前台");
            }
            if (CameraActivity.isShow) {
                Logger.t("CameraActivity").i("============表示无需跳转，已通过activity,正在照相界面", new Object[0]);
                return;
            }
            if (bArr[1] == 1 && bArr[2] == 1) {
                Logger.t("CameraActivity").d("============ " + ConvertHelper.byte2HexForShow(bArr));
                if (Build.VERSION.SDK_INT > 22) {
                    if (ContextCompat.checkSelfPermission(this.mContext, "android.permission.CAMERA") == -1) {
                        Logger.t(TAG).i("requestPermission,权限没有被开启,MainAcitivity申请", new Object[0]);
                        bleSendBroadcast(SputilVari.TAKE_PHOTO_OPRATE_PERMISSION, bArr);
                        return;
                    } else {
                        startCamera();
                        return;
                    }
                }
                startCamera();
            }
        }
    }

    private void startCamera() {
        long jCurrentTimeMillis = System.currentTimeMillis() - CameraActivity.lastExitTime;
        Logger.t("CameraActivity").d("=====================================【interval】= " + jCurrentTimeMillis);
        if (jCurrentTimeMillis < 200) {
            Logger.t("CameraActivity").d("=====================================【跳转到拍照页面-但间隔太短不跳转】==================================");
            return;
        }
        Logger.t("CameraActivity").d("=====================================【跳转到拍照页面】==================================");
        Intent intent = new Intent(this.mContext, (Class<?>) CameraActivity.class);
        intent.putExtra(TypedValues.TransitionType.S_FROM, "ble");
        intent.setFlags(AMapEngineUtils.MAX_P20_WIDTH);
        intent.addCategory("android.intent.category.HOME");
        this.mContext.startActivity(intent);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void initBleService(Intent intent) throws InterruptedException, NoSuchMethodException, SecurityException {
        switch (intent.getIntExtra("android.bluetooth.adapter.extra.STATE", Integer.MIN_VALUE)) {
            case 10:
                HBLogger.bleConnectLog("系统蓝牙开关状态改变-->【关闭】");
                ToastUtils.showDebug("蓝牙关闭");
                JLWatchFaceManager.getInstance().release();
                HBandApplication.dismissDeviceAIDialTransferDialog();
                Logger.t(TAG).i("通知栏-蓝牙关闭", new Object[0]);
                SpUtil.saveBoolean(this.mContext, SputilVari.BLE_FIND_SERVICE_AND_CONNECT_SUCCESS, false);
                bleSendBroadcast(BleBroadCast.DISCONNECTED_DEVICE_SUCCESS);
                SqlHelperUtil.updateBleConnect(this.mContext);
                break;
            case 11:
                Logger.t(TAG).i("通知栏-蓝牙正在打开", new Object[0]);
                break;
            case 12:
                HBLogger.bleConnectLog("系统蓝牙开关状态改变-->【打开】");
                ToastUtils.showDebug("蓝牙打开");
                Logger.t(TAG).i("通知栏-蓝牙打开", new Object[0]);
                HBandApplication.dismissDeviceAIDialTransferDialog();
                initialize("【蓝牙开关打开】");
                break;
            case 13:
                bleClose(ConnectDetails.CloseType.BLUE_CLOSE);
                this.isStartScanLooper = false;
                stopScan();
                stopLooper();
                Logger.t(TAG).i("通知栏-蓝牙正在关闭", new Object[0]);
                break;
        }
    }

    private void registerSysBroadCaster() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(BleBroadCast.BLUETOOTH_OPEN_CLOSE);
        intentFilter.addAction("android.intent.action.LOCALE_CHANGED");
        if (Build.VERSION.SDK_INT >= 34) {
            registerReceiver(this.BluetoothOpen, intentFilter, 2);
        } else {
            registerReceiver(this.BluetoothOpen, intentFilter);
        }
    }

    private void unRegisterSysBroadCaster() {
        unregisterReceiver(this.BluetoothOpen);
    }

    private boolean isAppForeground(Context context) {
        List<ActivityManager.RunningAppProcessInfo> runningAppProcesses = ((ActivityManager) context.getSystemService("activity")).getRunningAppProcesses();
        if (runningAppProcesses == null) {
            Log.d(TAG, "runningAppProcessInfoList is null!");
            return false;
        }
        for (ActivityManager.RunningAppProcessInfo runningAppProcessInfo : runningAppProcesses) {
            if (runningAppProcessInfo.processName.equals(context.getPackageName()) && runningAppProcessInfo.importance == 100) {
                return true;
            }
        }
        return false;
    }

    public void registerJLBroadcast() {
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction(WatchManager.ACTION_JL_SEND_DATE_2_DEVICE);
        intentFilter.addAction(WatchManager.ACTION_JL_WATCH_INIT);
        intentFilter.addAction(WatchManager.ACTION_JL_WATCH_NOTIFICATION);
        intentFilter.addAction(JLOTAManager.ACTION_JL_OTA_INIT);
        LocalBroadcastManager.getInstance(this.mContext).registerReceiver(this.jlBroadcastReceiver, intentFilter);
    }

    private void unregisterJLBroadcast() {
        LocalBroadcastManager.getInstance(this.mContext).unregisterReceiver(this.jlBroadcastReceiver);
    }

    /* JADX INFO: Access modifiers changed from: private */
    class JLBroadcastReceiver extends BroadcastReceiver {
        static /* synthetic */ void lambda$onReceive$0(BluetoothDevice bluetoothDevice, UUID uuid, UUID uuid2, boolean z, byte[] bArr) {
        }

        private JLBroadcastReceiver() {
        }

        @Override // android.content.BroadcastReceiver
        public void onReceive(Context context, Intent intent) throws InterruptedException {
            String action = intent.getAction();
            if (TextUtils.isEmpty(action)) {
            }
            action.hashCode();
            switch (action) {
                case "ACTION_JL_WATCH_INIT":
                    if (BluetoothService.this.mDevice != null) {
                        WatchManager.getInstance().init(BluetoothService.this.mDevice);
                        break;
                    }
                    break;
                case "ACTION_JL_SEND_DATE_2_DEVICE":
                    if (BluetoothService.this.mDevice != null) {
                        byte[] byteArrayExtra = intent.getByteArrayExtra(WatchManager.KEY_JL_DATA);
                        BluetoothService bluetoothService = BluetoothService.this;
                        bluetoothService.writeDataByBleAsync(bluetoothService.mDevice, BluetoothConstant.UUID_SERVICE, BluetoothConstant.UUID_WRITE, byteArrayExtra, new OnWriteDataCallback() { // from class: com.veepoo.hband.ble.BluetoothService$JLBroadcastReceiver$$ExternalSyntheticLambda0
                            @Override // com.veepoo.hband.j_l.send.OnWriteDataCallback
                            public final void onBleResult(BluetoothDevice bluetoothDevice, UUID uuid, UUID uuid2, boolean z, byte[] bArr) {
                                BluetoothService.JLBroadcastReceiver.lambda$onReceive$0(bluetoothDevice, uuid, uuid2, z, bArr);
                            }
                        });
                        break;
                    }
                    break;
                case "ACTION_JL_WATCH_NOTIFICATION":
                    if (BluetoothService.this.jlBleNotification != null) {
                        Logger.t(BluetoothService.TAG_JL).e("JL 打开通知", new Object[0]);
                        BluetoothService bluetoothService2 = BluetoothService.this;
                        bluetoothService2.openNotification(bluetoothService2.jlBleNotification, NotificationType.J_L);
                        break;
                    }
                    break;
                case "ACTION_JL_OTA_INIT":
                    if (BluetoothService.this.mDevice != null && BluetoothService.this.mBluetoothGatt != null) {
                        JLOTAManager.getInstance().init(BluetoothService.this.mBluetoothGatt);
                        break;
                    }
                    break;
            }
        }
    }

    public void writeDataByBleAsync(BluetoothDevice bluetoothDevice, UUID uuid, UUID uuid2, byte[] bArr, OnWriteDataCallback onWriteDataCallback) {
        addSendTask(bluetoothDevice, uuid, uuid2, bArr, onWriteDataCallback);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startSendDataThread() {
        if (this.mSendBleDataThread == null) {
            SendBleDataThread sendBleDataThread = new SendBleDataThread(this, new OnThreadStateListener() { // from class: com.veepoo.hband.ble.BluetoothService.19
                @Override // com.veepoo.hband.j_l.send.OnThreadStateListener
                public void onStart(long j, String str) {
                }

                @Override // com.veepoo.hband.j_l.send.OnThreadStateListener
                public void onEnd(long j, String str) {
                    BluetoothService.this.mSendBleDataThread = null;
                }
            });
            this.mSendBleDataThread = sendBleDataThread;
            sendBleDataThread.start();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void stopSendDataThread() {
        SendBleDataThread sendBleDataThread = this.mSendBleDataThread;
        if (sendBleDataThread != null) {
            sendBleDataThread.stopThread();
            this.mSendBleDataThread = null;
        }
    }

    private void addSendTask(BluetoothDevice bluetoothDevice, UUID uuid, UUID uuid2, byte[] bArr, OnWriteDataCallback onWriteDataCallback) {
        BluetoothGatt bluetoothGatt;
        if ((this.mSendBleDataThread == null || (bluetoothGatt = this.mBluetoothGatt) == null || !com.jieli.jl_bt_ota.util.BluetoothUtil.deviceEquals(bluetoothDevice, bluetoothGatt.getDevice())) ? false : this.mSendBleDataThread.addSendTask(this.mBluetoothGatt, uuid, uuid2, bArr, onWriteDataCallback)) {
            return;
        }
        onWriteDataCallback.onBleResult(bluetoothDevice, uuid, uuid2, false, bArr);
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void wakeupSendThread(BluetoothGatt bluetoothGatt, UUID uuid, UUID uuid2, int i, byte[] bArr) {
        if (this.mSendBleDataThread != null) {
            SystemClock.sleep(HBandApplication.JL_BIG_DATA_SEND_DURATION);
            SendBleDataThread.BleSendTask bleSendTask = new SendBleDataThread.BleSendTask(bluetoothGatt, uuid, uuid2, bArr, null);
            bleSendTask.setStatus(i);
            this.mSendBleDataThread.wakeupSendThread(bleSendTask);
        }
    }

    @Override // com.veepoo.hband.j_l.send.IBleOp
    public int getBleMtu() {
        return this.mBleMtu;
    }

    @Override // com.veepoo.hband.j_l.send.IBleOp
    public boolean writeDataByBle(BluetoothGatt bluetoothGatt, UUID uuid, UUID uuid2, byte[] bArr) throws InterruptedException {
        boolean zWriteCharacteristic = false;
        if (bluetoothGatt == null || uuid == null || uuid2 == null || bArr == null || bArr.length == 0) {
            JL_Log.d(TAG, "writeDataByBle : 1111111");
            return false;
        }
        BluetoothGattService service = bluetoothGatt.getService(uuid);
        if (service == null) {
            JL_Log.d(TAG, "writeDataByBle : 22222  serviceUUID = " + uuid.toString());
            return false;
        }
        BluetoothGattCharacteristic characteristic = service.getCharacteristic(uuid2);
        if (characteristic == null) {
            JL_Log.d(TAG, "writeDataByBle : 3333");
            return false;
        }
        if (uuid.equals(JL_BLE_UUID_SERVICE)) {
            Logger.t(TAG_JL).e("【杰理】-发送杰理数据- " + Thread.currentThread() + " - " + ConvertHelper.byte2Hex(bArr), new Object[0]);
        }
        try {
            characteristic.setValue(bArr);
            zWriteCharacteristic = bluetoothGatt.writeCharacteristic(characteristic);
        } catch (Exception e) {
            e.printStackTrace();
        }
        JL_Log.d(TAG, "writeDataByBle : " + CHexConver.byte2HexStr(bArr) + ", ret : " + zWriteCharacteristic);
        return zWriteCharacteristic;
    }

    enum NotificationType {
        VP_PROTOCOL("VP协议通知"),
        VP_UI("VP大数据通知"),
        J_L("杰理大数据通知"),
        ACTIONS("炬芯大数据通知"),
        BLUETRUM("中科大数据通知");

        String des;

        NotificationType(String str) {
            this.des = str;
        }

        @Override // java.lang.Enum
        public String toString() {
            return "【通知：" + this.des + "】";
        }
    }

    public void openNotification(BluetoothGattCharacteristic bluetoothGattCharacteristic, NotificationType notificationType) {
        try {
            if (bluetoothGattCharacteristic == null) {
                Logger.t(TAG_JL).e("openNotification notifyCharacteristic = null", new Object[0]);
                return;
            }
            BluetoothGatt bluetoothGatt = this.mBluetoothGatt;
            if (bluetoothGatt == null) {
                ToastUtils.showDebug("Gatt为null");
                return;
            }
            bluetoothGatt.setCharacteristicNotification(bluetoothGattCharacteristic, true);
            BluetoothGattDescriptor descriptor = bluetoothGattCharacteristic.getDescriptor(UUID.fromString("00002902-0000-1000-8000-00805f9b34fb"));
            if (descriptor != null) {
                if ((bluetoothGattCharacteristic.getProperties() & 16) > 0) {
                    descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                    HBLogger.bleConnectLog("开启通知#openNotification# descriptor.setValue ENABLE_NOTIFICATION_VALUE : " + notificationType.toString());
                    Logger.t(TAG_JL).e("开启通知 uuid = " + bluetoothGattCharacteristic.getUuid().toString(), new Object[0]);
                    Logger.t(PWD_ACTION).e("开启通知 uuid = " + bluetoothGattCharacteristic.getUuid().toString(), new Object[0]);
                } else if ((bluetoothGattCharacteristic.getProperties() & 32) > 0) {
                    descriptor.setValue(BluetoothGattDescriptor.ENABLE_INDICATION_VALUE);
                    HBLogger.bleConnectLog("开启通知#openNotification# descriptor.setValue ENABLE_INDICATION_VALUE : " + notificationType.toString());
                    Logger.t(TAG_JL).e("开启指示器 uuid = " + bluetoothGattCharacteristic.getUuid().toString(), new Object[0]);
                    Logger.t(PWD_ACTION).e("开启指示器 uuid = " + bluetoothGattCharacteristic.getUuid().toString(), new Object[0]);
                }
                boolean zWriteDescriptor = this.mBluetoothGatt.writeDescriptor(descriptor);
                HBLogger.bleConnectLog("开启通知#openNotification#" + notificationType.toString() + " - ret:" + zWriteDescriptor);
                if (notificationType == NotificationType.VP_PROTOCOL) {
                    StringBuilder sb = new StringBuilder();
                    sb.append("VP服务打开:");
                    sb.append(zWriteDescriptor ? "成功" : "失败");
                    sendBleConnectAction(sb.toString());
                }
                sendBleConnectAction("开始密码验证");
                Logger.t(PWD_ACTION).e("PWD---> [打开通知] SUCCESS ", new Object[0]);
                Logger.t(PWD_ACTION).e("openNotification BluetoothGatt.writeDescriptor  uuid = " + bluetoothGattCharacteristic.getUuid().toString() + " ret = " + zWriteDescriptor, new Object[0]);
                return;
            }
            Logger.t(TAG_JL).e(bluetoothGattCharacteristic.getUuid().toString() + " 不支持开启通知", new Object[0]);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendBleConnectAction(String str) {
        Intent intent = new Intent(BLE_CONNECT_ACTION);
        intent.putExtra("connectAction", str);
        LocalBroadcastManager.getInstance(this.mContext).sendBroadcast(intent);
    }

    public boolean isShowLog(String str, byte[] bArr) {
        if (TextUtils.isEmpty(str)) {
            return bArr == null || bArr[0] != -40;
        }
        return !(str.equals(SportHandler.STEP_ACTION) || str.equals(BleProfile.READ_CURRENT_SPORT_SPORTMODEL_OPRATE));
    }

    public void connectBleWithWorker(String str, String str2) throws Throwable {
        String str3 = "-connectBleWithWorker-: 【后台任务】开始执行连接：address = " + str + " , name = " + str2 + " ---- " + HBandApplication.appInSystemInfo();
        Logger.t(TAG).e(str3, new Object[0]);
        HBLogger.bleConnectLog(str3);
        WorkManager.getInstance(this.mContext).enqueue(new OneTimeWorkRequest.Builder(BleConnectWorker.class).setInputData(new Data.Builder().putString(BleConnectWorker.KEY_ADDRESS, str).putString(BleConnectWorker.KEY_NAME, str2).build()).build());
    }

    public void printMemoryInfo(Context context) throws IOException, NumberFormatException {
        ActivityManager activityManager = (ActivityManager) context.getSystemService("activity");
        ActivityManager.MemoryInfo memoryInfo = new ActivityManager.MemoryInfo();
        activityManager.getMemoryInfo(memoryInfo);
        long j = (memoryInfo.totalMem / 1024) / 1024;
        long j2 = (memoryInfo.availMem / 1024) / 1024;
        boolean z = memoryInfo.lowMemory;
        HBLogger.bleConnectLog("-----------------------------------------------------------------");
        HBLogger.bleConnectLog("#########################【总内存: " + j + " MB】 -【可用内存: " + j2 + " MB】 是否低内存: " + z + "");
        HBLogger.bleConnectLog("-----------------------------------------------------------------");
        try {
            BufferedReader bufferedReader = new BufferedReader(new FileReader("/proc/stat"));
            String line = bufferedReader.readLine();
            bufferedReader.close();
            if (line != null) {
                String[] strArrSplit = line.split(HexStringBuilder.DEFAULT_SEPARATOR);
                long j3 = Long.parseLong(strArrSplit[2]);
                long j4 = Long.parseLong(strArrSplit[3]);
                long j5 = Long.parseLong(strArrSplit[4]);
                long j6 = Long.parseLong(strArrSplit[5]);
                long j7 = Long.parseLong(strArrSplit[6]);
                long j8 = Long.parseLong(strArrSplit[7]);
                long j9 = Long.parseLong(strArrSplit[8]);
                long j10 = j3 + j4 + j5;
                HBLogger.bleConnectLog("#########################CPU使用率: " + (((((j10 + j7) + j8) + j9) * 100) / ((((j6 + j10) + j7) + j8) + j9)) + "%");
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void startRecording(boolean z) {
        Printer printerT = Logger.t(TAG);
        StringBuilder sb = new StringBuilder();
        sb.append("--: 开始录音：");
        sb.append(z ? "问答" : "文生图");
        printerT.e(sb.toString(), new Object[0]);
        AIRecordingUtil.getInstance().startRecording(this, z);
    }

    private void stopRecording(boolean z) {
        Printer printerT = Logger.t(TAG);
        StringBuilder sb = new StringBuilder();
        sb.append("--: 停止录音：");
        sb.append(z ? "问答" : "文生图");
        printerT.e(sb.toString(), new Object[0]);
        AIRecordingUtil.getInstance().stopRecording(this, z);
    }
}