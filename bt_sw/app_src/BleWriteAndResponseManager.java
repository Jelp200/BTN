package com.veepoo.hband.ble;

import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
import com.orhanobut.logger.Logger;
import com.orhanobut.logger.Printer;
import com.veepoo.hband.HBandApplication;
import com.veepoo.hband.ble.readmanager.OriginalDFHander;
import com.veepoo.hband.ble.readmanager.SleepHandler;
import com.veepoo.hband.util.ConvertHelper;
import com.veepoo.hband.util.log.HBLogger;
import java.util.Arrays;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

/* loaded from: classes3.dex */
public class BleWriteAndResponseManager {
    private static final String KEY_LAST_RECEIVE_DATA = "last_receive_data";
    public static final int RESPONSE_TIMEOUT = 5000;
    public static final String TAG = "-蓝牙数据读写-";
    private final Hashtable<byte[], Integer> cmdFailedTimesRecodeMap;
    private final Hashtable<byte[], Integer> cmdResponseTimeOutTimesRecodeMap;
    private final CopyOnWriteArrayList<byte[]> currentNeedCheckTimeoutCMDList;
    private OnResponseTimeoutListener responseTimeoutListener;
    public final Handler timeoutCheck;
    public static final UUID PROTOCOL_SERVICE_UUID = UUID.fromString("F0080001-0451-4000-B000-000000000000");
    public static final UUID PROTOCOL_CHARACTERISTIC_UUID = UUID.fromString("F0080003-0451-4000-B000-000000000000");
    public static final UUID PROTOCOL_READ_UUID = UUID.fromString("F0080002-0451-4000-B000-000000000000");
    public static final byte[] NEED_CHECK_WRITE_CMD_HEAD_LIST = {BleProfile.HEAD_SLEEP, BleProfile.HEAD_ORIGAL_DF, 80};
    public static final byte[] NEED_CHECK_RESPONSE_CMD_HEAD_LIST = {BleProfile.HEAD_SLEEP, BleProfile.HEAD_ORIGAL_DF};

    public interface OnDataSendFailedListener {
        void onDataSendFailed(byte[] bArr, int i);
    }

    public interface OnResponseTimeoutListener {
        void on3TimesNoResponse(byte[] bArr, byte[] bArr2);

        void onResponseTimeout(byte[] bArr, byte[] bArr2, int i);
    }

    private static class Holder {
        private static final BleWriteAndResponseManager INSTANCE = new BleWriteAndResponseManager();

        private Holder() {
        }
    }

    private BleWriteAndResponseManager() {
        this.cmdFailedTimesRecodeMap = new Hashtable<>();
        this.cmdResponseTimeOutTimesRecodeMap = new Hashtable<>();
        this.currentNeedCheckTimeoutCMDList = new CopyOnWriteArrayList<>();
        this.timeoutCheck = new Handler(Looper.getMainLooper()) { // from class: com.veepoo.hband.ble.BleWriteAndResponseManager.1
            @Override // android.os.Handler
            public void handleMessage(Message message) {
                super.handleMessage(message);
                Iterator it = BleWriteAndResponseManager.this.currentNeedCheckTimeoutCMDList.iterator();
                while (it.hasNext()) {
                    if (message.what == Arrays.hashCode((byte[]) it.next())) {
                        byte[] bArr = (byte[]) message.obj;
                        BleWriteAndResponseManager.this.clearReadDataByCMDNoResponse(bArr);
                        byte[] byteArray = message.getData().getByteArray(BleWriteAndResponseManager.KEY_LAST_RECEIVE_DATA);
                        if (BleWriteAndResponseManager.this.getCMDResponseTimeoutTimes(bArr) >= 3) {
                            HBLogger.bleChangeLog("-------------------> 指令连续三次回复超时> 归属指令：" + ConvertHelper.byte2HexForShow(bArr));
                            HBLogger.bleChangeLog("-------------------> 指令连续三次回复超时> 最后收到的指令" + ConvertHelper.byte2HexForShow(byteArray));
                            if (BleWriteAndResponseManager.this.responseTimeoutListener != null) {
                                BleWriteAndResponseManager.this.responseTimeoutListener.on3TimesNoResponse(bArr, byteArray);
                            }
                        } else {
                            BleWriteAndResponseManager.this.cmdResponseTimeoutTimesIncrease(bArr);
                            int cMDResponseTimeoutTimes = BleWriteAndResponseManager.this.getCMDResponseTimeoutTimes(bArr);
                            HBLogger.bleChangeLog("-------------------> 指令第" + cMDResponseTimeoutTimes + "次回复超时> 归属指令：" + ConvertHelper.byte2HexForShow(bArr));
                            HBLogger.bleChangeLog("-------------------> 指令第" + cMDResponseTimeoutTimes + "次回复超时> 最后收到的指令：" + ConvertHelper.byte2HexForShow(byteArray));
                            if (BleWriteAndResponseManager.this.responseTimeoutListener != null) {
                                BleWriteAndResponseManager.this.responseTimeoutListener.onResponseTimeout(bArr, byteArray, cMDResponseTimeoutTimes);
                            }
                        }
                        BleWriteAndResponseManager.this.printCMDResponseTimeoutTimesList();
                    }
                }
            }
        };
        this.responseTimeoutListener = null;
    }

    public static BleWriteAndResponseManager getInstance() {
        return Holder.INSTANCE;
    }

    public int getCMDSendFailedTimes(byte[] bArr) {
        Integer num = this.cmdFailedTimesRecodeMap.get(bArr);
        if (num != null) {
            return num.intValue();
        }
        return 0;
    }

    public int getCMDResponseTimeoutTimes(byte[] bArr) {
        Integer num = this.cmdResponseTimeOutTimesRecodeMap.get(bArr);
        if (num != null) {
            return num.intValue();
        }
        return 0;
    }

    public byte[] getResponseCMDByMsgWhat(int i) {
        Iterator<byte[]> it = this.currentNeedCheckTimeoutCMDList.iterator();
        while (it.hasNext()) {
            byte[] next = it.next();
            if (i == Arrays.hashCode(next)) {
                return next;
            }
        }
        return null;
    }

    public void printCMDSendFailedList() {
        HBLogger.bleWriteLog("发生失败记录列表==================================================================Start");
        for (byte[] bArr : this.cmdFailedTimesRecodeMap.keySet()) {
            HBLogger.bleWriteLog("-蓝牙数据读写-命令：" + ConvertHelper.byte2HexForShow(bArr) + " ---> 失败次数 ： " + this.cmdFailedTimesRecodeMap.get(bArr));
        }
        HBLogger.bleWriteLog("发生失败记录列表==================================================================End");
    }

    public void printCMDResponseTimeoutTimesList() {
        HBLogger.bleWriteLog("回复超时次数记录列表==================================================================Start");
        for (byte[] bArr : this.cmdResponseTimeOutTimesRecodeMap.keySet()) {
            HBLogger.bleWriteLog("-蓝牙数据读写-命令：" + ConvertHelper.byte2HexForShow(bArr) + " ---> 超时次数 ： " + this.cmdResponseTimeOutTimesRecodeMap.get(bArr));
        }
        HBLogger.bleWriteLog("回复超时次数记录列表==================================================================End");
    }

    public void cmdSendFailedTimesIncrease(byte[] bArr) {
        this.cmdFailedTimesRecodeMap.put(bArr, Integer.valueOf(getCMDSendFailedTimes(bArr) + 1));
    }

    public void cmdResponseTimeoutTimesIncrease(byte[] bArr) {
        this.cmdResponseTimeOutTimesRecodeMap.put(bArr, Integer.valueOf(getCMDResponseTimeoutTimes(bArr) + 1));
    }

    public void resetCMDSendFailedTimes(byte[] bArr) {
        this.cmdFailedTimesRecodeMap.remove(bArr);
    }

    public static boolean isWriteNeedCheckPlatform() {
        return BleChipPlatform.isBluetrum() || BleChipPlatform.isJieLi();
    }

    public static boolean isResponseNeedCheckPlatform() {
        return BleChipPlatform.isBluetrum();
    }

    public boolean isCMDNeedWriteCheck(byte[] bArr, UUID uuid, UUID uuid2) {
        if (uuid.toString().equalsIgnoreCase(PROTOCOL_SERVICE_UUID.toString()) && uuid2.toString().equalsIgnoreCase(PROTOCOL_CHARACTERISTIC_UUID.toString())) {
            for (byte b : NEED_CHECK_WRITE_CMD_HEAD_LIST) {
                if (b == bArr[0]) {
                    return true;
                }
            }
        }
        return uuid.toString().equalsIgnoreCase(BleProfile.UI_SERVICE_UUID.toString()) && uuid2.toString().equalsIgnoreCase(BleProfile.UI_CONFIG_UUID.toString());
    }

    public boolean isCMDNeedResponseCheck(byte[] bArr) {
        for (byte b : NEED_CHECK_RESPONSE_CMD_HEAD_LIST) {
            if (b == bArr[0]) {
                return true;
            }
        }
        return false;
    }

    private boolean isCMDNeedCheckResponseWithWriteTo(UUID uuid, UUID uuid2) {
        return uuid.toString().equalsIgnoreCase(PROTOCOL_SERVICE_UUID.toString()) && uuid2.toString().equalsIgnoreCase(PROTOCOL_CHARACTERISTIC_UUID.toString());
    }

    private boolean isCMDNeedCheckResponseWithChange(UUID uuid) {
        return uuid.toString().equalsIgnoreCase(PROTOCOL_READ_UUID.toString());
    }

    public boolean isNeedHandleWriteFailedCMD(byte[] bArr, UUID uuid, UUID uuid2) {
        return isWriteNeedCheckPlatform() && isCMDNeedWriteCheck(bArr, uuid, uuid2);
    }

    public boolean isNeedHandleResponseTimeoutCMDByChanged(byte[] bArr, UUID uuid) {
        return isResponseNeedCheckPlatform() && isCMDNeedResponseCheck(bArr) && isCMDNeedCheckResponseWithChange(uuid);
    }

    public boolean isNeedHandleResponseTimeoutCMDByWrite(byte[] bArr, UUID uuid, UUID uuid2) {
        return isResponseNeedCheckPlatform() && isCMDNeedResponseCheck(bArr) && isCMDNeedCheckResponseWithWriteTo(uuid, uuid2);
    }

    public void clearWriteFailRecodes() {
        this.cmdFailedTimesRecodeMap.clear();
    }

    public void clearResponseTimeoutRecodes() {
        this.cmdResponseTimeOutTimesRecodeMap.clear();
    }

    public void clearCMDTimeoutCheckList() {
        this.currentNeedCheckTimeoutCMDList.clear();
    }

    public static void clearRecodes() {
        getInstance().clearWriteFailRecodes();
        getInstance().clearResponseTimeoutRecodes();
        getInstance().clearCMDTimeoutCheckList();
    }

    public void handlerData(byte[] bArr, UUID uuid) {
        if (isNeedHandleResponseTimeoutCMDByChanged(bArr, uuid)) {
            byte[] msgWhatByteResponseData = getMsgWhatByteResponseData(bArr, uuid);
            int iHashCode = Arrays.hashCode(msgWhatByteResponseData);
            Logger.t(TAG).e("《========收到回复 removeMessages：" + iHashCode + " , CMD = " + ConvertHelper.byte2HexForShow(msgWhatByteResponseData), new Object[0]);
            this.timeoutCheck.removeMessages(iHashCode);
            Logger.t(TAG).e("《========收到当前需要检查回复的指令 msgWhat = " + iHashCode + " , CMD = " + ConvertHelper.byte2HexForShow(msgWhatByteResponseData) + "--》back = " + ConvertHelper.byte2HexForShow(bArr), new Object[0]);
            if (isLastPackageNumber(bArr)) {
                HBLogger.bleChangeLog("<==== 收到需要进行超时检测的<最后一包>:" + ConvertHelper.byte2HexForShow(msgWhatByteResponseData) + ", 取消超时检测:msgWhat = " + iHashCode);
                Printer printerT = Logger.t(TAG);
                StringBuilder sb = new StringBuilder();
                sb.append("《========收到需要进行超时检测的--<最后一包>--，【本次指令未出现回复超时】：");
                sb.append(ConvertHelper.byte2HexForShow(msgWhatByteResponseData));
                printerT.i(sb.toString(), new Object[0]);
                this.currentNeedCheckTimeoutCMDList.remove(msgWhatByteResponseData);
                Logger.t(TAG).v("===============>_________________________--------- 移除msg：" + iHashCode + " -- " + ConvertHelper.byte2HexForShow(msgWhatByteResponseData), new Object[0]);
                return;
            }
            Logger.t(TAG).e("《========非最后一包数据：" + ConvertHelper.byte2HexForShow(msgWhatByteResponseData) + " =====》 重新开启5s延迟检测 = " + iHashCode, new Object[0]);
            Message messageObtainMessage = this.timeoutCheck.obtainMessage();
            messageObtainMessage.obj = msgWhatByteResponseData;
            messageObtainMessage.getData().putByteArray(KEY_LAST_RECEIVE_DATA, bArr);
            messageObtainMessage.what = iHashCode;
            this.timeoutCheck.sendMessageDelayed(messageObtainMessage, 5000L);
        }
    }

    private byte[] getMsgWhatByteResponseData(byte[] bArr, UUID uuid) {
        Iterator<byte[]> it = this.currentNeedCheckTimeoutCMDList.iterator();
        while (it.hasNext()) {
            byte[] next = it.next();
            Logger.t(TAG).v("===============>$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ 已存在的 ：" + ConvertHelper.byte2HexForShow(next) + " --> msgWhat = " + Arrays.hashCode(next), new Object[0]);
        }
        if (!isNeedHandleResponseTimeoutCMDByChanged(bArr, uuid)) {
            return null;
        }
        Iterator<byte[]> it2 = this.currentNeedCheckTimeoutCMDList.iterator();
        while (it2.hasNext()) {
            byte[] next2 = it2.next();
            if (next2[0] == bArr[0]) {
                return next2;
            }
        }
        return null;
    }

    public void startTimeoutCheckTask(byte[] bArr, UUID uuid, UUID uuid2) {
        resetCMDSendFailedTimes(bArr);
        if (isNeedHandleResponseTimeoutCMDByWrite(bArr, uuid, uuid2)) {
            int iHashCode = Arrays.hashCode(bArr);
            if (!this.currentNeedCheckTimeoutCMDList.contains(bArr)) {
                this.currentNeedCheckTimeoutCMDList.add(bArr);
                Logger.t(TAG).v("===============>++++++++++++++++++++++++++++++++++++++++++++++++++++++ 添加一个超时检测的指令 ：" + ConvertHelper.byte2HexForShow(bArr) + " --> msgWhat = " + iHashCode, new Object[0]);
            }
            this.timeoutCheck.removeMessages(iHashCode);
            Logger.t(TAG).i("========》指令：" + ConvertHelper.byte2HexForShow(bArr) + " 开始5s超时检测任务：msgWhat = " + iHashCode, new Object[0]);
            Message messageObtainMessage = this.timeoutCheck.obtainMessage();
            messageObtainMessage.obj = bArr;
            messageObtainMessage.what = iHashCode;
            messageObtainMessage.getData().putByteArray(KEY_LAST_RECEIVE_DATA, null);
            HBLogger.bleChangeLog("====> 当前任务:" + ConvertHelper.byte2HexForShow(bArr) + "需要添加一个5s超时的回复检测任务 ==》开启5s超时回复检测:msgWhat = " + iHashCode);
            this.timeoutCheck.sendMessageDelayed(messageObtainMessage, 5000L);
        }
    }

    private boolean isLastPackageNumber(byte[] bArr) {
        if (!isCMDNeedResponseCheck(bArr)) {
            return true;
        }
        byte b = bArr[0];
        return b != -33 ? b == -32 && ConvertHelper.byte2HexToIntArr(bArr)[1] == 0 : bArr[1] == bArr[2] && bArr[2] == -1;
    }

    /* JADX INFO: Access modifiers changed from: private */
    public void clearReadDataByCMDNoResponse(byte[] bArr) {
        if (isCMDNeedResponseCheck(bArr)) {
            byte b = bArr[0];
            if (b == -33) {
                OriginalDFHander.getInstance().clear();
            } else {
                if (b != -32) {
                    return;
                }
                SleepHandler.getInstance().clearSleepItem();
            }
        }
    }

    public void setResponseTimeoutListener(OnResponseTimeoutListener onResponseTimeoutListener) {
        this.responseTimeoutListener = onResponseTimeoutListener;
    }

    public void sendBleConnectAction(String str) {
        Intent intent = new Intent(BluetoothService.BLE_CONNECT_ACTION);
        intent.putExtra("connectAction", str);
        LocalBroadcastManager.getInstance(HBandApplication.mContext).sendBroadcast(intent);
    }

    public boolean isData3TimesSendFailedNeedGattClose(UUID uuid, UUID uuid2) {
        return uuid.toString().equalsIgnoreCase(PROTOCOL_SERVICE_UUID.toString()) && uuid2.toString().equalsIgnoreCase(PROTOCOL_CHARACTERISTIC_UUID.toString());
    }
}