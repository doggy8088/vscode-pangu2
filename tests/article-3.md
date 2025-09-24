# 已知問題

## 以下格式轉換會有問題 (可能原本的格式就有問題)

@copilot 實作不太正確，完全不符合我原始的需求，請重新檢視我的需求。

## 以下內容：

"C:\Users\<user>\.gitconfig"
"C:\Users\<user>\_gitconfig"
"C:\Users\<user>\*gitconfig"
"C:\Users\<user>\$gitconfig"
**C:\Users\&lt;username&gt;\\.ssh\github_rsa**

## 透過盤古之白轉換後會變成以下：

"C:\Users\<user>.gitconfig"
**C:\Users\&lt;username>\\.ssh\github\_rsa**

## 正確的轉換應該是這樣：

"C:\Users\\&lt;user&gt;\\.gitconfig"
**C:\Users\\&lt;username&gt;\\.ssh\github\_rsa**

## 以下格式轉換會有問題，會刪除原本就有的空白字元

```sh
如何让 git pull / push / fetch 不用输入账号、密码
```

會變成以下

```sh
## 如何让 git pull /push/fetch 不用输入账号、密码
```

正常應該是這樣

```sh
如何让 git pull / push / fetch 不用输入账号、密码
```

- [x] 所有 Inline 語法 (link, ~, _, `` ` ``) 都會在每次格式化時加入額外空白

```sh
的 `stash@{0}` 這
```

會變成以下

```sh
的  `stash@{0}`  這
```

正常應該是這樣

```sh
的 `stash@{0}` 這
```


## 所有網址都會被 auto-link 修改掉，包含在 code block 裡面的內容

```sh
* git config user.email "will@example.com"
```

會變成以下

```sh
* git config user.email "<will@example.com>"
```

正常應該是這樣

```sh
* git config user.email "will@example.com"
```





