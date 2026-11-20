# 压位Trie（分层位集）

值域 [0,U)，U>=0 且能预分配；每个值最多保留一份，不记录重复次数。 next(x) 严格 >x，prev(x) 严格 <x；返回的是元素值，全部无解均返回 -1。 x=-1 可找首元素，x=U 可找末元素；contains/erase 对域外值返回 false。

操作 O(log_64 U)，contains O(1)；空间约 U/8 字节。

```cpp
class PackedTrieSet {
    int universe;
    vector<vector<u64>> bits;
    int successor(int level, int x) const {
        if (x < 0)
            x = 0;
        int block = x / 64, offset = x % 64;
        if (block >= int(bits[level].size()))
            return -1;
        u64 v = bits[level][block] & (~0ULL << offset);
        if (v)
            return block * 64 + __builtin_ctzll(v);
        if (level + 1 == int(bits.size()))
            return -1;
        int b = successor(level + 1, block + 1);
        return b < 0 ? -1 : b * 64 + __builtin_ctzll(bits[level][b]);
    }
    int predecessor(int level, int x) const {
        if (x < 0)
            return -1;
        x = std::min<i64>(x, i64(bits[level].size()) * 64 - 1);
        int block = x / 64, offset = x % 64;
        u64 v = bits[level][block] & (~0ULL >> (63 - offset));
        if (v)
            return block * 64 + 63 - __builtin_clzll(v);
        if (level + 1 == int(bits.size()))
            return -1;
        int b = predecessor(level + 1, block - 1);
        return b < 0 ? -1 : b * 64 + 63 - __builtin_clzll(bits[level][b]);
    }

  public:
    // 创建值域 [0,U) 的空集合；U=0 合法。
    explicit PackedTrieSet(int U) : universe(U) {
        assert(U >= 0);
        size_t words = std::max<size_t>(1, (size_t(U) + 63) / 64);
        for (;;) {
            bits.emplace_back(words, 0);
            if (words == 1)
                break;
            words = (words + 63) / 64;
        }
    }
    // 返回 x 是否在集合中；域外返回 false。
    bool contains(int x) const {
        return 0 <= x && x < universe && ((bits[0][x / 64] >> (x % 64)) & 1);
    }
    // 插入合法值 x；新插入返回 true，重复返回 false。
    bool insert(int x) {
        assert(0 <= x && x < universe);
        if (contains(x))
            return false;
        for (auto &layer : bits) {
            int block = x / 64;
            u64 old = layer[block];
            layer[block] |= 1ULL << (x % 64);
            if (old)
                break;
            x = block;
        }
        return true;
    }
    // 删除 x；存在返回 true，域外或不存在返回 false。
    bool erase(int x) {
        if (!contains(x))
            return false;
        for (auto &layer : bits) {
            int block = x / 64;
            layer[block] &= ~(1ULL << (x % 64));
            if (layer[block])
                break;
            x = block;
        }
        return true;
    }
    // 返回严格大于 x 的最小元素；无解 -1，x 可以为 -1。
    int next(int x) const {
        if (x >= universe - 1)
            return -1;
        return successor(0, x < 0 ? 0 : x + 1);
    }
    // 返回严格小于 x 的最大元素；无解 -1，x 可以为 U。
    int prev(int x) const {
        if (x <= 0)
            return -1;
        return predecessor(0, std::min(x, universe) - 1);
    }
    // 返回最小元素；空集合 -1。
    int min() const {
        return next(-1);
    }
    // 返回最大元素；空集合 -1。
    int max() const {
        return prev(universe);
    }
};
```
