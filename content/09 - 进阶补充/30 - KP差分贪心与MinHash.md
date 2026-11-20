# KP差分贪心与MinHash

KP 输入非负 long long；MinHash 需 K>=1；比较签名必须同 seed 与 K。 两者均为近似算法；MinHash 按集合处理重复值，两空集合相似度为 1，一空一非空为 0。

KP O(n log n) 时间 / O(n) 空间；签名 O(Kn) 时间 / O(K) 空间，比较 O(K)。

```cpp
namespace randomized_math {
    // 差分贪心的两组和差上界，空/单元素分别返回0/该元素；不保证全局最优。
    long long partitionDifference(const std::vector<long long> &w) {
        std::priority_queue<long long> q;
        for (auto x : w) {
            assert(x >= 0);
            q.push(x);
        }
        while (q.size() > 1) {
            auto a = q.top();
            q.pop();
            auto b = q.top();
            q.pop();
            q.push(a - b);
        }
        return q.empty() ? 0 : q.top();
    }
    // values[i] 为第 i 组比较值（共 K 项），seed 为生成种子，empty 表示原集合为空。
    struct Signature {
        std::vector<unsigned long long> values;
        unsigned long long seed;
        bool empty;
    };
    // MinHash 签名族。
    class MinHash {
        int K;
        unsigned long long seed;
        std::vector<unsigned long long> salts;
        static unsigned long long mix(unsigned long long x) {
            x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
            x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
            return x ^ (x >> 31);
        }

      public:
        // 固定K与seed的签名族；seed允许复现实验。
        explicit MinHash(int K = 128, unsigned long long seed = 20261005)
            : K(K), seed(seed), salts(K) {
            assert(K >= 1);
            std::mt19937_64 rng(seed);
            for (auto &v : salts)
                v = rng();
        }
        // 返回集合签名；重复keys不改变结果。
        Signature signature(const std::vector<unsigned long long> &keys) const {
            Signature s{std::vector<unsigned long long>(K, ULLONG_MAX), seed, keys.empty()};
            // ponytail: salted 64位伪随机置换只作近似；需严格独立/碰撞界时换经过证明的min-wise哈希族。
            for (auto x : keys)
                for (int i = 0; i < K; ++i)
                    s.values[i] = std::min(s.values[i], mix(x ^ salts[i]));
            return s;
        }
        // 返回相等最小哈希比例，签名必须同族；空集合特殊约定见头注释。
        double estimate(const Signature &a, const Signature &b) const {
            assert(a.seed == seed && b.seed == seed && a.values.size() == K &&
                   b.values.size() == K);
            if (a.empty || b.empty)
                return a.empty == b.empty ? 1 : 0;
            int same = 0;
            for (int i = 0; i < K; ++i)
                same += a.values[i] == b.values[i];
            return double(same) / K;
        }
    };
}
```
