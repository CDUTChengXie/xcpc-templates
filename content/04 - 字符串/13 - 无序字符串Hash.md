# 无序字符串Hash

支持所有 256 种字节；哈希可能碰撞；跨对象比较使用相同 seed。 下标从 0 开始，区间 [l,r)（含左端，不含右端）；equal 同时比较长度，空区间的哈希为 {0,0}。

预处理 O(n+256)；查询 O(1)；空间 O(n)。

```cpp
// 比较字符多重集的双 64 位权值和哈希。
class UnorderedStringHash {
    vector<array<u64, 2>> pref;

  public:
    // 为 256 字节字符分配两路权值；不同对象比较须采用相同 seed。
    explicit UnorderedStringHash(const string &s, u64 seed = 0x13dcae91ULL) : pref(s.size() + 1) {
        mt19937_64 rng(seed);
        array<array<u64, 2>, 256> weight;
        for (auto &x : weight)
            x = {rng(), rng()};
        for (int i = 0; i < int(s.size()); i++)
            for (int k = 0; k < 2; k++)
                pref[i + 1][k] = pref[i][k] + weight[static_cast<unsigned char>(s[i])][k];
    }
    // 返回 [l,r) 的两路无序哈希；无符号溢出按模 2^64 计算。
    array<u64, 2> get(int l, int r) const {
        assert(0 <= l && l <= r && r < int(pref.size()));
        return {pref[r][0] - pref[l][0], pref[r][1] - pref[l][1]};
    }
    // 比较两段的长度及字符多重集哈希；true 仍有碰撞可能。
    bool equal(int l1, int r1, int l2, int r2) const {
        auto a = get(l1, r1), b = get(l2, r2);
        return r1 - l1 == r2 - l2 && a == b;
    }
};
```
