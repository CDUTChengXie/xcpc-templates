# 最长公共子序列（位集加速）

普通 LCS 每行从左到右，长度只会保持或增加 1。因此不用逐列存长度，只用一个二进制位记这一列有没有增加。整行里 1 的个数就是该行最后一列的答案。

处理长串的下一个字符时，`x = state | positions[c]` 标出旧增长点和本轮能匹配的列。每个旧增长点之后都要找下一级最早能到哪一列：`y = (state << 1) | 1` 标出各段起点，减法借位会一直传到该段第一个可用的 1。`x & ~(x-y)` 就留下新的增长点。按 64 位分块时，左移进位和减法借位都要传给下一块。

按无符号字节处理；用 64 位块显式处理减法借位，空串答案为 0。

O(|长串|*ceil(|短串|/64)) 时间，O(256*ceil(|短串|/64)) 空间。

```cpp
namespace SequenceFast {
// 返回任意字节字符串 LCS 长度，64 位块的减法显式处理借位
    size_t lcs(std::string_view a, std::string_view b) {
        if (a.size() < b.size())
            std::swap(a, b);
        size_t blocks = (b.size() + 63) / 64;
        std::vector<std::vector<u64>> positions(256, std::vector<u64>(blocks));
        for (size_t i = 0; i < b.size(); ++i)
            positions[static_cast<unsigned char>(b[i])][i / 64] |= u64(1) << (i % 64);
        std::vector<u64> state(blocks);
        for (unsigned char c : a) {
            u64 carry = 1, borrow = 0;
            for (size_t j = 0; j < blocks; ++j) {
                u64 old = state[j], x = old | positions[c][j], y = (old << 1) | carry;
                carry = old >> 63;
                u64 difference = x - y - borrow, nextBorrow = (x < y) || (borrow && x == y);
                state[j] = x & ~difference;
                borrow = nextBorrow;
            }
        }
        size_t length = 0;
        for (u64 x : state)
            length += std::popcount(x);
        return length;
    }
}
```

## 约瑟夫环（批量跳步）

n>=1、k>=1，参数和返回值为 u64；人物 [0,n)，从 0 报 1，数到 k 出局。

k<=n 时 O(k log n)，k>n 退化 O(n)，空间为实际缩小层数。

```cpp
namespace SequenceFast {
// 返回约瑟夫最后幸存者；显式记录缩小过程，避免递归深栈
    u64 josephus(u64 n, u64 k) {
        if (n == 0 || k == 0)
            throw std::invalid_argument("josephus");
        if (k == 1)
            return n - 1;
        std::vector<u64> frames;
        while (n > 1) {
            frames.push_back(n);
            n -= k > n ? 1 : n / k;
        }
        u64 result = 0;
        for (auto it = frames.rbegin(); it != frames.rend(); ++it) {
            u64 size = *it;
            if (k > size)
                result = u64((static_cast<unsigned __int128>(result) + k) % size);
            else if (result < size % k)
                result = size - (size % k - result);
            else {
                result -= size % k;
                result += result / (k - 1);
            }
        }
        return result;
    }
}
```
