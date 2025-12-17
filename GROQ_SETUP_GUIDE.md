# 🚀 Quick Setup: Use Groq Instead of Ollama

## Problem
You're getting this error:
```
"Failed to generate completion: Ollama is not running. Please install Ollama or configure Groq API."
```

## Solution: Use Groq (Cloud AI - Free & Fast!)

Groq provides **FREE** cloud AI models that are extremely fast. No local installation needed!

---

## 🎯 Quick Setup (5 minutes)

### Step 1: Get Groq API Key

1. **Visit**: https://console.groq.com
2. **Sign up** for a free account
3. **Go to API Keys** section
4. **Create new API key**
5. **Copy the key** (starts with `gsk_...`)

### Step 2: Configure in Your App

1. **Go to Settings**:
   ```
   http://localhost:3000/settings/ai-config
   ```

2. **Click "Providers" tab**

3. **Paste your Groq API Key**:
   - Find "Groq API" section
   - Paste key in the API Key field
   - Click "Save Changes"

### Step 3: Select Groq Model

1. **Click "Models" tab**

2. **Select a Groq model** from dropdown:
   - **Llama 3.1 70B** (Recommended - Best performance)
   - **Mixtral 8x7B** (Good for long context)

3. **Click "Save Changes"**

### Step 4: Test It!

1. **Open AI Assistant** (sparkles button)
2. **Send a message**: "Hello!"
3. **Should work instantly!** ✅

---

## 🆚 Groq vs Ollama

| Feature | Groq | Ollama |
|---------|------|--------|
| **Setup** | Just API key | Install software |
| **Speed** | ⚡ Very fast | Slower |
| **Cost** | 🆓 Free tier | Free (local) |
| **Internet** | Required | Not required |
| **Models** | Llama 3.1, Mixtral | Any model |
| **Privacy** | Cloud | Local |

---

## 🎨 Model Selector

The AI Assistant now has a **model selector** in the header!

```
┌─────────────────────────────────────┐
│ 🤖 AI Assistant                     │
│ ● We're online                      │
├─────────────────────────────────────┤
│ [⚡ Llama 3.1 70B (Groq)      ▼]  │ ← Click to switch
└─────────────────────────────────────┘
```

**You can switch models anytime:**
- Click the dropdown
- Select different model
- Continue chatting

---

## 🔧 Alternative: Install Ollama (Local AI)

If you prefer local AI:

### 1. Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Mac:**
```bash
brew install ollama
```

**Windows:**
Download from https://ollama.com

### 2. Start Ollama

```bash
ollama serve
```

### 3. Pull Model

```bash
ollama pull qwen2.5:0.5b
```

### 4. Test

```bash
ollama run qwen2.5:0.5b "Hello!"
```

### 5. Use in App

- Model selector will automatically detect Ollama
- Select "Qwen 2.5 0.5B (Local)"
- Start chatting!

---

## 📊 Current Configuration

Based on your setup:

### ✅ Models Available
1. **Qwen 2.5 0.5B (Local)** - Default
   - Provider: OLLAMA
   - Status: ⚠️ Requires Ollama running

2. **Llama 3.1 70B (Groq)** - Recommended
   - Provider: GROQ
   - Status: ⚠️ Requires API key

3. **Mixtral 8x7B (Groq)**
   - Provider: GROQ
   - Status: ⚠️ Requires API key

### 🎯 Recommended Action

**Use Groq for now** (fastest setup):
1. Get API key from console.groq.com
2. Add to Settings > AI Config > Providers
3. Select Llama 3.1 70B in Models tab
4. Start chatting!

---

## 🐛 Troubleshooting

### "Ollama is not running"
- Either start Ollama: `ollama serve`
- Or use Groq (add API key)

### "Invalid API key"
- Check key is correct (starts with `gsk_`)
- Verify key is active in Groq console
- Try regenerating key

### "Model not found"
- Make sure you selected a model in Settings
- Check model is active
- Try refreshing the page

### Still not working?
1. Check browser console (F12)
2. Look for error messages
3. Verify API key is saved
4. Try different model

---

## 💡 Pro Tips

### 1. Use Groq for Speed
Groq models are **extremely fast** - perfect for development!

### 2. Switch Models Easily
Use the model selector to switch between:
- Fast models for quick queries
- Powerful models for complex tasks
- Local models for privacy

### 3. Monitor Usage
Go to Settings > AI Config > Usage tab to see:
- Token usage
- Costs
- Model performance

### 4. Set Default Model
In Settings > AI Config > Models:
- Select your preferred model
- Click Save
- It will be used by default

---

## 🎉 Summary

**Fastest way to get started:**

1. ✅ Get Groq API key (free)
2. ✅ Add to Settings > Providers
3. ✅ Select Llama 3.1 70B
4. ✅ Start chatting!

**Total time: ~5 minutes** ⏱️

---

## 📚 Resources

- **Groq Console**: https://console.groq.com
- **Groq Docs**: https://console.groq.com/docs
- **Ollama**: https://ollama.com
- **AI Config Settings**: http://localhost:3000/settings/ai-config

---

**Created**: December 17, 2025 at 10:44 PM UTC+05:30  
**Status**: 🚀 READY TO USE
