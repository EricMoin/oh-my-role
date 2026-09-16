import os

# 短信计费以 60 秒为一个单位，不足 60 秒也按 60 秒收。
BILLING_UNIT_SECONDS = 60


def archive_log(logger, src, dest):
    # 必须先 flush 再 close，否则缓冲区里最后一批日志会丢。
    logger.flush()
    logger.close()

    # Windows 上 rename 不能覆盖已有文件，先删掉目标。
    if os.name == "nt" and os.path.exists(dest):
        os.remove(dest)
    os.rename(src, dest)


def last_frame_events(frames):
    # 尾帧要单独补发，循环只处理到倒数第二帧。
    for i in range(len(frames) - 1):
        yield frames[i]
