# MooreNim多堆取石

k>=1；各堆为 u64；正常规则，不能行动者输。 各堆可取不同数量；每位 1 的堆数对 k+1 取模全为 0 才必败；不返回 SG 值。

O(64n) 时间，O(64) 空间。

```cpp
namespace MooreNim {
    // 返回各二进制位上 1 的堆数模 k+1；不把此编码当作 SG 值
    std::array<u64, 64> residues(const std::vector<u64> &a, int k) {
        if (k < 1)
            throw std::invalid_argument("k");
        std::array<u64, 64> r{};
        for (u64 x : a)
            for (int b = 0; b < 64; ++b)
                r[b] += (x >> b) & 1;
        for (u64 &v : r)
            v %= u64(k) + 1;
        return r;
    }
    // 全部位计数均整除 k+1 时返回 true，表示先手必败
    bool losing(const std::vector<u64> &a, int k) {
        auto r = residues(a, k);
        return std::all_of(r.begin(), r.end(), [](u64 x) { return x == 0; });
    }
}
```
