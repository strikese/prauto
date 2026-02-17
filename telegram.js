import fetch from 'node-fetch';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';
import fs from 'fs';
import path from 'path';
// 配置信息

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const getFormattedDate = () => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        ...options,
    });
    return date.replace(/\//g, '-'); // 替换斜杠为横杠
};
const msg1 = `
✳️ **[𝐕𝐋𝐄𝐒𝐒快速体验订阅地址](https://t.me/Marisa_kristi)**

🚀 **快速订阅 edge（自适应）**：
\`https://mar.mot.cloudns.biz/?sub\`

🚀 **快速订阅 snippet（自适应）**：
\`https://spsub.mot.cloudns.biz/?sub\`

🛡️ **𝐌𝐢𝐡𝐨𝐦𝐨** (Clash Meta)：  
\`https://mar.mot.cloudns.biz/?clash\`

📦 **𝐒𝐢𝐧𝐠𝐛𝐨𝐱**：  
\`https://mar.mot.cloudns.biz/?sb\`

🦉 **𝐋𝐨𝐨𝐧**：  
\`https://mar.mot.cloudns.biz/?loon\`

🌐 **订阅器**

Worker 部署的 VLESS 可通过填入 URL 路径  
快速获取节点订阅信息：

🔗 **订阅链接**：  
https://你的订阅链接?sub=sub.mot.cloudns.biz

────────────────  
📋 **edgetunnel 订阅器**  
────────────────  

SUB = \`sub.mot.cloudns.biz\`

────────────────  
🧪 **edgetunnel 订阅器(beta版)**  
────────────────  

SUB = \`subbeta.mot.cloudns.biz\`

────────────────  
🧪 **snippet 订阅器**  
────────────────  

SUB = \`spsub.mot.cloudns.biz\`
  `;

const msg2 = `
🎉 欢迎你一起使用 DNSHE 免费域名服务！

通过我的邀请链接注册，你可以获得：
✨ 5 个永久域名
🌐 免费子域名注册
🚀 强大的 DNS 管理功能
🛡️ Cloudflare 企业级保护

💫 使用一个邀请码额外解锁一个域名名额
✨ 邀请码: \`EY4548E9A3\`
✨ 邀请码: \`TD9607A8FD\`
✨ 邀请码: \`YVF4673279\`
✨ 邀请码: \`MN980A05C7\`
✨ 邀请码: \`YFEEC3D20A\`
让我们一起探索互联网的无限可能！
`;

const msg3 = `
${getFormattedDate()} 订阅节点(proxyip) 已更新
`;

// 需要发送的文本和文件列表
const messages = [
    {
        type: 'text',
        message: msg1,
        buttons: [[{ text: '🌐 监控面板', url: 'https://edt.bbc.xx.kg' }]],
    },
    {
        type: 'file',
        path: 'DNSHE.jpg',
        message: msg2,
        buttons: [
            [
                {
                    text: '🌐 立即注册',
                    url: 'https://my.dnshe.com/aff.php?aff=54240',
                },
            ],
        ],
    },
    {
        type: 'file',
        path: 'proxyip.txt',
        message: msg3,
        buttons: [
            [
                { text: '📡 edgetunnel快速订阅', url: 'https://mar.bbc.xx.kg/?sub' },
                { text: '📡 snippet快速订阅', url: 'https://spsub.bbc.xx.kg/sub' },
            ],
            [
                { text: '🌐 edgetunnel订阅器', url: 'https://sub.mot.cloudns.biz' },
                { text: '🌐 snippet订阅器', url: 'https://spsub.bbc.xx.kg' },
            ],
            [
                {
                    text: '🌐 免费域名',
                    url: 'https://my.dnshe.com/aff.php?aff=54240',
                },
                { text: '🔍 TG 搜索', url: 'https://t.me/jiso?start=a_5298771389' },
            ],
            [
                { text: '🔁 订阅转换', url: 'https://sub.ikar.eu.org' },
                {
                    text: '📱 流量卡',
                    url: 'https://172.lot-ml.com/ProductEn/Index/eae30f76df4c8eb8',
                },
            ],
            [{ text: '✉️ 临时邮箱', url: 'https://t.me/email_kristi_bot' }],
        ],
    },
];

class TelegramBotSender {
    constructor(botToken, chatId, storagePath = './message_ids.json') {
        if (!botToken || !chatId) {
            throw new Error('Bot token and chat ID are required');
        }

        this.botToken = botToken;
        this.chatId = chatId;
        this.storagePath = storagePath;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
        this.messageIds = this.loadMessageIds();

        // 文件类型到API方法和字段的映射
        this.fileTypeMap = {
            image: {
                extensions: ['.jpg', '.jpeg', '.png', '.gif'],
                method: 'sendPhoto',
                field: 'photo',
            },
            video: {
                extensions: ['.mp4', '.mov', '.avi', '.mkv'],
                method: 'sendVideo',
                field: 'video',
            },
            audio: {
                extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
                method: 'sendAudio',
                field: 'audio',
            },
            document: {
                extensions: ['*'],
                method: 'sendDocument',
                field: 'document',
            },
        };
    }

    // 加载已保存的消息ID
    loadMessageIds() {
        try {
            if (fs.existsSync(this.storagePath)) {
                const data = fs.readFileSync(this.storagePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.warn(`⚠️ 无法加载消息ID文件: ${error.message}`);
        }
        return [];
    }

    // 保存消息ID到文件
saveMessageIds() {
    try {
        // 检查文件是否存在
        if (fs.existsSync(this.storagePath)) {
            // 文件存在，读取现有内容并合并
            const existingData = fs.readFileSync(this.storagePath, 'utf8');
            const existingIds = JSON.parse(existingData);
            
            // 合并现有ID和新ID（去重）
            const mergedIds = [...new Set([...existingIds, ...this.messageIds])];
            
            // 写入合并后的数据
            fs.writeFileSync(this.storagePath, JSON.stringify(mergedIds, null, 2));
            console.log(`💾 消息ID已追加保存到: ${this.storagePath} (原有 ${existingIds.length} 条, 新增 ${this.messageIds.length} 条)`);
            
            // 更新内存中的messageIds为合并后的数据
            this.messageIds = mergedIds;
        } else {
            // 文件不存在，直接写入
            fs.writeFileSync(this.storagePath, JSON.stringify(this.messageIds, null, 2));
            console.log(`💾 消息ID已新建保存到: ${this.storagePath} (共 ${this.messageIds.length} 条)`);
        }
    } catch (error) {
        console.error(`❌ 保存消息ID失败: ${error.message}`);
    }
}

    // 删除指定消息
    async deleteMessage(messageId) {
        if (!messageId) return false;

        const url = `${this.baseUrl}/deleteMessage`;
        const payload = {
            chat_id: this.chatId,
            message_id: messageId,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data.ok) {
                console.log(`🗑️ 消息已删除: ${messageId}`);
                return true;
            } else {
                console.warn(`⚠️ 删除消息失败 ${messageId}:`, data.description);
                return false;
            }
        } catch (error) {
            console.error(`❌ 删除消息时出错 ${messageId}:`, error.message);
            return false;
        }
    }

    // 删除所有已保存的旧消息
    async deleteOldMessages() {
        if (this.messageIds.length === 0) {
            console.log('📭 没有需要删除的旧消息');
            return;
        }

        console.log(`🗑️ 开始删除 ${this.messageIds.length} 条旧消息...`);

        const results = await Promise.allSettled(this.messageIds.map((messageId) => this.deleteMessage(messageId)));

        const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length;
        const failed = results.filter((r) => r.status === 'rejected' || !r.value).length;

        console.log(`📊 删除完成: ${successful} 成功, ${failed} 失败`);

        // 清空消息ID数组
        this.messageIds = [];
        this.saveMessageIds();
    }

    // 发送所有消息（文本 & 文件）
async sendMessages(messages) {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.warn('⚠️ 没有消息需要发送');
        return;
    }

    try {
        // 1. 首先删除所有旧消息
        await this.deleteOldMessages();

        // 2. 发送新消息
        let successful = 0;
        let failed = 0;
        const newMessageIds = []; // 临时存储新消息ID

        for (const [index, item] of messages.entries()) {
            let result;
            try {
                if (item.type === 'text') {
                    result = await this.sendTextMessage(item.message, item.buttons);
                } else if (item.type === 'file') {
                    result = await this.sendFile(item.path, item.message, item.buttons);
                } else {
                    throw new Error(`未知的消息类型: ${item.type}`);
                }

                // 保存新消息的ID到临时数组
                if (result && result.result && result.result.message_id) {
                    newMessageIds.push(result.result.message_id);
                    successful++;
                }
                
                // 每成功发送一条消息，就保存一次ID，防止中途失败导致数据丢失
                this.messageIds = [...this.messageIds, ...newMessageIds];
                this.saveMessageIds();
                
            } catch (error) {
                failed++;
                console.error(`❌ 消息 ${index + 1} 发送失败:`, error.message);
            }
        }

        // 统计发送结果
        console.log(`\n📊 发送完成: ${successful} 成功, ${failed} 失败`);
    } catch (error) {
        console.error('❌ 发送消息过程中出错:', error);
        throw error;
    }
}
    // 发送纯文本消息
    async sendTextMessage(text, buttons = null) {
        if (!text || typeof text !== 'string') {
            throw new Error('文本消息内容不能为空');
        }

        const url = `${this.baseUrl}/sendMessage`;
        const payload = {
            chat_id: this.chatId,
            text: text,
            parse_mode: 'Markdown',
        };

        if (buttons) {
            payload.reply_markup = {
                inline_keyboard: buttons,
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || '未知错误');
            }

            console.log(`✅ 文本消息发送成功 (ID: ${data.result.message_id})`);
            return data;
        } catch (error) {
            console.error('❌ 发送文本消息失败:', error.message);
            throw error;
        }
    }

    // 发送文件和文字消息
    async sendFile(filePath, caption = '', buttons = null) {
        if (!filePath) {
            throw new Error('文件路径不能为空');
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            throw new Error(`文件不存在: ${filePath}`);
        }

        // 获取文件类型信息
        const fileTypeInfo = this.getFileTypeInfo(filePath);
        const url = `${this.baseUrl}/${fileTypeInfo.method}`;

        // 创建表单数据
        const formData = new FormData();
        formData.set('chat_id', this.chatId);

        if (caption) {
            formData.set('caption', caption);
            formData.set('parse_mode', 'Markdown');
        }

        if (buttons) {
            formData.set('reply_markup', JSON.stringify({ inline_keyboard: buttons }));
        }
        formData.set(fileTypeInfo.field, await fileFromPath(filePath));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: formData.headers,
                body: formData,
            });

            const data = await response.json();

            if (!data.ok) {
                throw new Error(data.description || '未知错误');
            }

            console.log(`✅ 文件发送成功: ${path.basename(filePath)} (ID: ${data.result.message_id})`);
            return data;
        } catch (error) {
            console.error(`❌ 发送文件失败: ${path.basename(filePath)}`, error.message);
            throw error;
        }
    }

    // 根据文件扩展名获取文件类型信息
    getFileTypeInfo(filePath) {
        const ext = path.extname(filePath).toLowerCase();

        for (const [type, info] of Object.entries(this.fileTypeMap)) {
            if (info.extensions.includes('*') || info.extensions.includes(ext)) {
                return {
                    method: info.method,
                    field: info.field,
                };
            }
        }

        // 默认作为文档发送
        return {
            method: this.fileTypeMap.document.method,
            field: this.fileTypeMap.document.field,
        };
    }

    // 清理所有消息（手动调用）
    async cleanupAllMessages() {
        return await this.deleteOldMessages();
    }
}

// 使用示例
async function main() {
    try {
        // 创建发送器实例，可以指定存储文件路径
        const botSender = new TelegramBotSender(botToken, chatId, './telegram_messages.json');

        // 发送消息（会自动删除上次的消息）
        await botSender.sendMessages(messages);

        // 如果需要手动清理所有消息，可以调用：
        //await botSender.cleanupAllMessages();
    } catch (error) {
        console.error('程序执行失败:', error.message);
        process.exit(1);
    }
}

// 执行主函数
main();
