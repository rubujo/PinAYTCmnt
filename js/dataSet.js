"use strict";

/**
 * 訊息組
 */
class MessageSet {
  /**
   * 訊息：醒來
   */
  static WakeUp = "wakeUp";
}

/**
 * CMID 組
 */
class CMIDSet {
  /**
   * 共用的 ContextMenu 選項「釘選已選取的內容」的 ID 值
   */
  static PinSelectedContent = "PinSelectedContent";

  /**
   * 共用的 ContextMenu 選項「附加釘選已選取的內容」的 ID 值
   */
  static AppendPinSelectedContent = "AppendPinSelectedContent";

  /**
   * 共用的 ContextMenu 選項「解除釘選已選取的內容」的 ID 值
   */
  static UnpinSelectedContent = "UnpinSelectedContent";

  /**
   * 共用的 ContextMenu 選項「重設已釘選的內容的位置」的 ID 值
   */
  static ResetPinnedContentPosition = "ResetPinnedContentPosition";

  /**
   * 共用的 ContextMenu 選項「開闔已釘選的內容」的 ID 值
   */
  static TogglePinnedContent = "TogglePinnedContent";
}

/**
 * 指令組
 */
class CommandSet {
  /**
   * 指令：釘選已選取的內容
   */
  static PinSelectedContent = "pinSelectedContent";

  /**
   * 指令：附加釘選已選取的內容
   */
  static AppendPinSelectedContent = "appendPinSelectedContent";

  /**
   * 指令：解除釘選已選取的內容
   */
  static UnpinSelectedContent = "unpinSelectedContent";

  /**
   * 指令：重設已釘選的內容的位置
   */
  static ResetPinnedContentPosition = "resetPinnedContentPosition";

  /**
   * 指令：開闔已釘選的內容
   */
  static TogglePinnedContent = "togglePinnedContent";
}

/**
 * 字串組
 */
class StringSet {
  /**
   * 分隔符號 "^"
   */
  static Separator = "^";
}

export { MessageSet, CMIDSet, CommandSet, StringSet };
